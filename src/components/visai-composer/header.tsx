import { Bot } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex items-center h-16 px-6 border-b border-border bg-card flex-shrink-0">
      <div className="flex items-center gap-3">
        <Bot className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-bold font-headline text-foreground">
          Banana Boi
        </h1>
      </div>
    </header>
  );
}
