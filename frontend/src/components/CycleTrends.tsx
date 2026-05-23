import { useEffect, useRef, useState } from 'react';
// @ts-ignore
import * as d3 from 'd3';
import axios from 'axios';
import { TrendingUp } from 'lucide-react';

interface TrendData {
  number: number;
  totalVotesCast: number;
  totalFundingAllocated: number;
}

export const CycleTrends = () => {
  const [data, setData] = useState<TrendData[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('http://localhost:3000/governance/trends');
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch trends', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!svgRef.current || data.length < 2) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = 150;
    const margin = { top: 20, right: 20, bottom: 20, left: 40 };

    const x = d3.scaleLinear()
      .domain(d3.extent(data, (d: TrendData) => d.number) as [number, number])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, (d: TrendData) => d.totalVotesCast) as number])
      .range([height - margin.bottom, margin.top]);

    const line = d3.line<TrendData>()
      .x((d: TrendData) => x(d.number))
      .y((d: TrendData) => y(d.totalVotesCast))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 3)
      .attr('d', line);

    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(data.length).tickFormat((d: any) => `C${d}`));

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5));

  }, [data]);

  if (data.length < 2) {
    return (
      <div className="bg-white border rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center text-gray-400 min-h-[200px]">
        <TrendingUp size={48} className="mb-4 opacity-20" />
        <p className="font-bold">Not enough data for trends yet.</p>
        <p className="text-xs font-medium">Complete at least two cycles to see history.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-3xl p-8 shadow-sm">
      <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
        <TrendingUp className="text-blue-500" size={20} />
        Voter Participation Trend
      </h3>
      <svg ref={svgRef} className="w-full h-[150px]" />
    </div>
  );
};
