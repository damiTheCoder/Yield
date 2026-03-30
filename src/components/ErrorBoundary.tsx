import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = "/";
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
                    <div className="mb-4 rounded-full bg-red-100 p-4 dark:bg-red-900/20">
                        <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
                    </div>
                    <h1 className="mb-2 text-2xl font-bold text-foreground">Something went wrong</h1>
                    <p className="mb-6 max-w-md text-muted-foreground">
                        {this.state.error?.message || "An unexpected error occurred while rendering this page."}
                    </p>
                    <div className="flex gap-4">
                        <Button onClick={() => window.location.reload()} variant="outline">
                            Reload Page
                        </Button>
                        <Button onClick={this.handleReset}>Return Home</Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
