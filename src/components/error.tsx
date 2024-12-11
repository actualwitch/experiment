import styled from "@emotion/styled";
import { Component, type PropsWithChildren } from "react";

const Container = styled.div`
  padding: 1em;
`;

type Props = PropsWithChildren<{}>;
export class ErrorBoundary extends Component<Props, { error?: unknown }> {
  constructor(props: Props) {
    super(props);
    this.state = { error: undefined };
  }

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (<Container><h1>Something went wrong.</h1>
        <details>
          <summary>Details</summary>
          <pre>{String(this.state.error)}</pre>
          <pre><code>{JSON.stringify(this.state.error, null, 2)}</code></pre>
        </details>
      </Container>);
    }

    return this.props.children;
  }
}
