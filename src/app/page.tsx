import Header from '@/components/visai-composer/header';
import NodeEditor from '@/components/visai-composer/node-editor';

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
