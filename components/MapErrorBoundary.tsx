"use client";

import { Component, ReactNode } from "react";

export class MapErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Falha ao carregar o mapa do terminal:", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="map-error" role="alert">
        <p>Não foi possível carregar o mapa do terminal.</p>
        <button onClick={() => window.location.reload()}>Tentar novamente</button>
      </div>
    );
  }
}
