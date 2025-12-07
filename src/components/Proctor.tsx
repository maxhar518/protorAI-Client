import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, Mic, AlertTriangle } from "lucide-react";
import { useProctoring, ProctoringState, ProctoringActions } from "@/hooks/useProctoring";

interface ProctorProps {
  children: React.ReactNode;
  isSubmitted: boolean;
  currentQuestionIndex: number;
  onProctoringReady: (state: ProctoringState, actions: ProctoringActions) => void;
}

const Proctor = ({ children, isSubmitted, currentQuestionIndex, onProctoringReady }: ProctorProps) => {
  const { state, actions, refs } = useProctoring({ isSubmitted, currentQuestionIndex });

  useEffect(() => {
    actions.startMedia();
    return () => {
      actions.cleanupMedia();
    };
  }, []);

  useEffect(() => {
    onProctoringReady(state, actions);
  }, [state, actions, onProctoringReady]);

  const shouldBlur = !state.permissionsGranted || state.showFullscreenWarning;

  const getViolationColor = () => {
    if (state.totalViolations === 0) return "text-green-600";
    if (state.totalViolations < 3) return "text-yellow-600";
    return "text-red-600";
  };

  if (state.permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-lg font-medium">
                Requesting camera and microphone access...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Hidden media elements */}
      <video ref={refs.videoRef} autoPlay playsInline muted className="hidden" />
      <audio ref={refs.audioRef} autoPlay muted className="hidden" />
      <canvas ref={refs.canvasRef} className="hidden" />

      {/* Permission Warning Overlay */}
      {state.showPermissionWarning && !state.showFullscreenWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4 border-2 border-destructive/50 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-destructive/10 rounded-full">
                  <AlertTriangle className="h-12 w-12 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-destructive">
                Access Required
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {!state.browserSupported
                  ? "Your browser doesn't support camera and microphone access."
                  : "Camera and microphone access are required for exam integrity and proctoring."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription className="flex items-start gap-3">
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Camera className="h-5 w-5" />
                      <span className="font-medium">Camera Access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mic className="h-5 w-5" />
                      <span className="font-medium">Microphone Access</span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              {state.permissionViolated && (
                <Alert variant="destructive">
                  <AlertDescription>
                    ⚠️ Permission violation detected. Your quiz attempt may be invalidated.
                  </AlertDescription>
                </Alert>
              )}

              {state.browserSupported && (
                <Button
                  onClick={actions.startMedia}
                  className="w-full bg-destructive hover:bg-destructive/90"
                  size="lg"
                >
                  Grant Permissions
                </Button>
              )}

              {!state.browserSupported && (
                <p className="text-sm text-muted-foreground text-center">
                  Please use a modern browser (Chrome, Firefox, Safari, or Edge) to take this quiz.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fullscreen Warning Overlay */}
      {state.showFullscreenWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4 border-2 border-yellow-500/50 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-yellow-500/10 rounded-full">
                  <AlertTriangle className="h-12 w-12 text-yellow-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-yellow-600">
                Fullscreen Required
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Fullscreen mode is required for exam integrity. Please re-enter fullscreen to continue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-yellow-500/50 bg-yellow-500/10">
                <AlertDescription className="text-yellow-800">
                  ⚠️ Exiting fullscreen is counted as a violation. {3 - state.totalViolations} warnings remaining.
                </AlertDescription>
              </Alert>

              <Button
                onClick={actions.enterFullscreen}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
                size="lg"
              >
                Re-enter Fullscreen
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quiz Content with Blur */}
      <div className={`transition-all duration-300 ${shouldBlur ? "blur-lg pointer-events-none" : ""}`}>
        <div className="max-w-4xl mx-auto p-4">
          {/* Recording Indicator */}
          {state.permissionsGranted && !isSubmitted && (
            <div className="mb-4 flex justify-between items-center bg-card border rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Recording Active</span>
                </div>
                <span className="text-xs text-muted-foreground ml-4">Session: {state.sessionId}</span>
              </div>
              {state.imageCaptureFailures > 0 && (
                <span className="text-xs text-yellow-600">⚠️ {state.imageCaptureFailures} capture failures</span>
              )}
            </div>
          )}

          {/* Violation Counter */}
          {state.totalViolations > 0 && !isSubmitted && (
            <div className="mb-4">
              <Alert className={`border-2 ${state.totalViolations >= 3 ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'}`}>
                <AlertTriangle className={`h-4 w-4 ${getViolationColor()}`} />
                <AlertDescription className={`${getViolationColor()} font-semibold`}>
                  ⚠️ Proctoring Violations: {state.totalViolations}/3
                  {state.totalViolations >= 3 && " - Submission Blocked"}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
};

export default Proctor;
