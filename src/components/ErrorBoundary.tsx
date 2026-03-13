import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : 'Erro inesperado.';
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error(`[ErrorBoundary${this.props.name ? ` - ${this.props.name}` : ''}]`, error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle size={28} className="text-destructive" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold">Algo deu errado</p>
            <p className="text-sm text-muted-foreground font-body max-w-xs">{this.state.message}</p>
          </div>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium active:scale-[0.98] transition-transform"
          >
            <RefreshCw size={14} />
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
