import Header from '@/components/banana-boi/header';
import NodeEditor from '@/components/banana-boi/node-editor';

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground w-full">
      <Header />
      <main className="flex-1 overflow-hidden">
        <NodeEditor />
      </main>
    </div>
  );
}
