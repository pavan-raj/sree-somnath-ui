import './TopBar.css';

import type { ReactNode } from 'react';

type TopBarProps = {
  title: string;
  subtitle: string;
  actions: ReactNode[];
};

export default function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="top-actions">{actions}</div>
    </header>
  );
}
