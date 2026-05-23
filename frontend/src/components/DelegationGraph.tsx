import React, { useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { User } from '../../../src/models/types.js';

interface DelegationGraphProps {
  users: User[];
  subject: string;
}

export const DelegationGraph: React.FC<DelegationGraphProps> = ({ users, subject }) => {
  const data = useMemo(() => {
    const nodes = users.map(u => ({
      id: u.id,
      name: u.name,
      val: 10 + (u.voiceCredits / 10)
    }));

    const links: { source: string; target: string }[] = [];
    users.forEach(u => {
      const delegateId = u.delegates[subject];
      if (delegateId && users.find(target => target.id === delegateId)) {
        links.push({
          source: u.id,
          target: delegateId
        });
      }
    });

    return { nodes, links };
  }, [users, subject]);

  return (
    <div className="bg-white border rounded-3xl overflow-hidden h-[400px] shadow-sm relative flex items-center justify-center">
      <div className="absolute top-4 left-6 z-10">
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Delegation Graph: {subject}</h4>
      </div>
      <ForceGraph2D
        graphData={data}
        nodeLabel="name"
        nodeColor={() => '#3b82f6'}
        linkColor={() => '#94a3b8'}
        linkDirectionalArrowLength={5}
        linkDirectionalArrowRelPos={1}
        width={800}
        height={400}
        backgroundColor="#ffffff"
        d3VelocityDecay={0.1}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 12/globalScale;
          ctx.font = `${fontSize}px Inter, sans-serif`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          if (node.x !== undefined && node.y !== undefined) {
             ctx.fillRect(node.x - bckgDimensions[0]! / 2, node.y - bckgDimensions[1]! / 2, bckgDimensions[0]!, bckgDimensions[1]!);
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             ctx.fillStyle = '#1e293b';
             ctx.fillText(label, node.x, node.y);
          }

          node.__bckgDimensions = bckgDimensions; // to use in nodePointerAreaPaint
        }}
      />
    </div>
  );
};
