"use client";

import { createChart, ColorType, ISeriesApi, Time, CandlestickSeries } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';

export const ChartComponent = ({ marketPda, resolution = "1m" }: { marketPda: string, resolution?: string }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Chart Configuration for modern dark theme
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9CA3AF',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      }
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e', // text-color-buy
      downColor: '#ef4444', // text-color-sell
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });
    
    candlestickSeriesRef.current = candlestickSeries;

    // Fetch initial historical candles
    const API_URL = process.env.NEXT_PUBLIC_API_URL as string;
    fetch(`${API_URL}/api/markets/${marketPda}/candles?resolution=${resolution}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.candles) {
          const formattedData = data.candles.map((c: any) => ({
            time: Math.floor(new Date(c.timestamp).getTime() / 1000) as Time,
            open: Number(c.open) / 1e9,
            high: Number(c.high) / 1e9,
            low: Number(c.low) / 1e9,
            close: Number(c.close) / 1e9,
          }));
          candlestickSeries.setData(formattedData);
          if (formattedData.length > 0) {
            chart.timeScale().fitContent();
          }
        }
      })
      .catch(err => console.error("Failed to load historical candles:", err));

    // Connect WebSocket
    const baseUrl = process.env.NEXT_PUBLIC_WS_URL as string || "";
    const WS_URL = baseUrl.endsWith('/ws') ? baseUrl : `${baseUrl}/ws`;
    const ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
      // Subscribe to the market
      ws.send(JSON.stringify({ type: "subscribe", marketPda }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "candle_update" && msg.data) {
          const c = msg.data;
          candlestickSeries.update({
            time: Math.floor(new Date(c.timestamp).getTime() / 1000) as Time,
            open: Number(c.open) / 1e9,
            high: Number(c.high) / 1e9,
            low: Number(c.low) / 1e9,
            close: Number(c.close) / 1e9,
          });
        }
      } catch (e) {
        console.error("Failed to process websocket message", e);
      }
    };

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth || 0 });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      ws.close();
      chart.remove();
    };
  }, [marketPda, resolution]);

  return (
    <div className="w-full h-[400px]" ref={chartContainerRef} />
  );
};
