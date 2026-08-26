"use client";

import { createChart, ColorType, ISeriesApi, Time, CandlestickSeries } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';

export const ChartComponent = ({ marketPda }: { marketPda: string }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Chart Configuration for retro dark theme
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0a0a' },
        textColor: '#00ff00',
      },
      grid: {
        vertLines: { color: '#333333' },
        horzLines: { color: '#333333' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      }
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#39ff14',
      downColor: '#ff073a',
      borderVisible: false,
      wickUpColor: '#39ff14',
      wickDownColor: '#ff073a',
    });
    
    candlestickSeriesRef.current = candlestickSeries;

    // Fetch initial historical candles
    const API_URL = process.env.NEXT_PUBLIC_API_URL as string;
    fetch(`${API_URL}/api/markets/${marketPda}/candles`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.candles) {
          const formattedData = data.candles.map((c: any) => ({
            time: (new Date(c.timestamp).getTime() / 1000) as Time,
            open: Number(c.openLamports) / 1e9,
            high: Number(c.highLamports) / 1e9,
            low: Number(c.lowLamports) / 1e9,
            close: Number(c.closeLamports) / 1e9,
          }));
          candlestickSeries.setData(formattedData);
        }
      })
      .catch(err => console.error("Failed to load historical candles:", err));

    // Connect WebSocket
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL as string;
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
            time: (new Date(c.timestamp).getTime() / 1000) as Time,
            open: Number(c.openLamports) / 1e9,
            high: Number(c.highLamports) / 1e9,
            low: Number(c.lowLamports) / 1e9,
            close: Number(c.closeLamports) / 1e9,
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
  }, [marketPda]);

  return (
    <div className="w-full h-[400px]" ref={chartContainerRef} />
  );
};
