import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export interface ViolationLog {
  type: 'tab-switch' | 'fullscreen-exit';
  timestamp: string;
}

export interface ProctoringState {
  permissionsGranted: boolean;
  permissionsLoading: boolean;
  showPermissionWarning: boolean;
  permissionViolated: boolean;
  browserSupported: boolean;
  isFullscreen: boolean;
  showFullscreenWarning: boolean;
  tabSwitchCount: number;
  fullscreenExitCount: number;
  totalViolations: number;
  violationLog: ViolationLog[];
  sessionId: string;
  imageCaptureFailures: number;
}

export interface ProctoringActions {
  startMedia: () => Promise<void>;
  enterFullscreen: () => Promise<void>;
  exportViolationLog: (score?: number | null) => Promise<void>;
  cleanupMedia: () => void;
}

export interface ProctoringRefs {
  videoRef: React.RefObject<HTMLVideoElement>;
  audioRef: React.RefObject<HTMLAudioElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

interface UseProctoringOptions {
  isSubmitted: boolean;
  currentQuestionIndex: number;
}

export const useProctoring = ({ isSubmitted, currentQuestionIndex }: UseProctoringOptions) => {
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [showPermissionWarning, setShowPermissionWarning] = useState(false);
  const [permissionViolated, setPermissionViolated] = useState(false);
  const [browserSupported, setBrowserSupported] = useState(true);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violationLog, setViolationLog] = useState<ViolationLog[]>([]);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [imageCaptureFailures, setImageCaptureFailures] = useState(0);

  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const totalViolations = tabSwitchCount + fullscreenExitCount;

  const cleanupMedia = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const captureImage = useCallback((): string | null => {
    try {
      if (!videoRef.current || !canvasRef.current) return null;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (video.readyState !== 4) {
        console.warn("Video not ready for capture");
        return null;
      }

      if (!context) return null;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      return canvas.toDataURL('image/jpeg', 0.7);
    } catch (error) {
      console.error('Error capturing image:', error);
      return null;
    }
  }, []);

  const sendImageToBackend = useCallback(async (imageData: string, retryCount = 0) => {
    try {
      const payload = {
        sessionId,
        timestamp: new Date().toISOString(),
        questionIndex: currentQuestionIndex,
        imageData,
      };

      console.log('📸 Image captured for proctoring:', {
        sessionId: payload.sessionId,
        timestamp: payload.timestamp,
        questionIndex: payload.questionIndex,
        imageSize: `${(imageData.length / 1024).toFixed(2)} KB`,
      });

      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/exam/DetectLogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      setImageCaptureFailures(0);
    } catch (error) {
      console.error('Error sending image to backend:', error);
      setImageCaptureFailures((prev) => prev + 1);

      if (retryCount < 2) {
        setTimeout(() => sendImageToBackend(imageData, retryCount + 1), 2000);
      }
    }
  }, [sessionId, currentQuestionIndex]);

  const exportViolationLog = useCallback(async (score?: number | null) => {
    try {
      const exportData = {
        sessionId,
        timestamp: new Date().toISOString(),
        totalViolations: tabSwitchCount + fullscreenExitCount,
        tabSwitchCount,
        fullscreenExitCount,
        violationLog,
        permissionViolated,
        quizCompleted: isSubmitted,
        score: score || null,
      };

      console.log('📊 Violation log exported:', JSON.stringify(exportData, null, 2));

      localStorage.setItem(`violation-log-${sessionId}`, JSON.stringify(exportData));

      toast({
        description: "✅ Proctoring data saved successfully",
      });
    } catch (error) {
      console.error('Error exporting violation log:', error);
    }
  }, [sessionId, tabSwitchCount, fullscreenExitCount, violationLog, permissionViolated, isSubmitted, toast]);

  const startMedia = useCallback(async () => {
    try {
      setPermissionsLoading(true);

      if (!navigator.mediaDevices?.getUserMedia) {
        setBrowserSupported(false);
        setShowPermissionWarning(true);
        setPermissionsGranted(false);
        setPermissionsLoading(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      if (audioRef.current) audioRef.current.srcObject = stream;

      setPermissionsGranted(true);
      setShowPermissionWarning(false);
      setPermissionsLoading(false);

      const validateTracks = () => {
        if (!streamRef.current) {
          setPermissionsGranted(false);
          setShowPermissionWarning(true);
          if (!isSubmitted) setPermissionViolated(true);
          return;
        }

        const videoTracks = streamRef.current.getVideoTracks();
        const audioTracks = streamRef.current.getAudioTracks();

        const videoEnabled = videoTracks.some((t) => t.enabled && t.readyState === 'live');
        const audioEnabled = audioTracks.some((t) => t.enabled && t.readyState === 'live');

        const bothEnabled = videoEnabled && audioEnabled;
        setPermissionsGranted(bothEnabled);
        setShowPermissionWarning(!bothEnabled);

        if (!bothEnabled && !isSubmitted) {
          setPermissionViolated(true);
        }
      };

      validateTracks();
      intervalRef.current = setInterval(validateTracks, 2000);

    } catch (error) {
      console.error("Error accessing media devices:", error);
      setPermissionsGranted(false);
      setShowPermissionWarning(true);
      setPermissionsLoading(false);
      setPermissionViolated(true);

      toast({
        title: "Permission Denied",
        description: "Camera and microphone access are required for the quiz.",
        variant: "destructive",
      });
    }
  }, [isSubmitted, toast]);

  const enterFullscreen = useCallback(async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        setShowFullscreenWarning(false);
      }
    } catch (error) {
      console.error("Error entering fullscreen:", error);
    }
  }, []);

  // Tab switching detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmitted && permissionsGranted) {
        setTabSwitchCount((prev) => {
          const newCount = prev + 1;
          const currentTotalViolations = newCount + fullscreenExitCount;

          setViolationLog((logs) => [...logs, {
            type: 'tab-switch',
            timestamp: new Date().toISOString()
          }]);

          if (newCount === 1) {
            toast({
              title: "⚠️ Warning",
              description: "Tab switching detected - 1st violation",
              variant: "destructive",
            });
          } else if (newCount === 2) {
            toast({
              title: "⚠️ Warning",
              description: "Tab switching detected - 2nd violation. One more will invalidate your exam",
              variant: "destructive",
            });
          } else if (currentTotalViolations >= 3) {
            toast({
              title: "⚠️ Exam Invalidated",
              description: "Quiz submission blocked due to multiple violations",
              variant: "destructive",
            });
          }

          return newCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isSubmitted, permissionsGranted, fullscreenExitCount, toast]);

  // Fullscreen enforcement
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = document.fullscreenElement !== null;
      setIsFullscreen(isCurrentlyFullscreen);

      if (!isCurrentlyFullscreen && !isSubmitted && permissionsGranted) {
        setShowFullscreenWarning(true);

        setFullscreenExitCount((prev) => {
          const newCount = prev + 1;
          const currentTotalViolations = tabSwitchCount + newCount;

          setViolationLog((logs) => [...logs, {
            type: 'fullscreen-exit',
            timestamp: new Date().toISOString()
          }]);

          if (newCount === 1) {
            toast({
              title: "⚠️ Warning",
              description: "Fullscreen mode exited - 1st violation",
              variant: "destructive",
            });
          } else if (newCount === 2) {
            toast({
              title: "⚠️ Warning",
              description: "Fullscreen mode exited - 2nd violation. One more will invalidate your exam",
              variant: "destructive",
            });
          } else if (currentTotalViolations >= 3) {
            toast({
              title: "⚠️ Exam Invalidated",
              description: "Quiz submission blocked due to multiple violations",
              variant: "destructive",
            });
          }

          return newCount;
        });
      }
    };

    if (permissionsGranted && !isSubmitted) {
      enterFullscreen();
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [permissionsGranted, isSubmitted, tabSwitchCount, enterFullscreen, toast]);

  // Copy/Paste prevention
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      toast({
        description: "ℹ️ Copy/paste is disabled during the exam",
      });
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      toast({
        description: "ℹ️ Copy/paste is disabled during the exam",
      });
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      toast({
        description: "ℹ️ Cut is disabled during the exam",
      });
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast({
        description: "ℹ️ Right-click is disabled during the exam",
      });
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [toast]);

  // Image capture every 4 seconds
  useEffect(() => {
    if (!permissionsGranted || isSubmitted) return;

    const video = videoRef.current;
    if (!video) return;

    let hasStartedCapture = false;

    const startImageCapture = () => {
      if (hasStartedCapture) return;
      hasStartedCapture = true;

      console.log("Starting auto-capture interval...");

      captureIntervalRef.current = setInterval(() => {
        const imageData = captureImage();
        if (imageData) {
          sendImageToBackend(imageData);
        } else {
          console.warn("Failed to capture image from video feed");
        }
      }, 4000);
    };

    const handleLoadedData = () => {
      console.log(video.videoWidth, video.videoHeight, video.readyState);
      startImageCapture();
    };

    video.addEventListener("loadeddata", handleLoadedData);

    return () => {
      video.removeEventListener("loadeddata", handleLoadedData);
      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
    };
  }, [permissionsGranted, isSubmitted, captureImage, sendImageToBackend]);

  const state: ProctoringState = {
    permissionsGranted,
    permissionsLoading,
    showPermissionWarning,
    permissionViolated,
    browserSupported,
    isFullscreen,
    showFullscreenWarning,
    tabSwitchCount,
    fullscreenExitCount,
    totalViolations,
    violationLog,
    sessionId,
    imageCaptureFailures,
  };

  const actions: ProctoringActions = {
    startMedia,
    enterFullscreen,
    exportViolationLog,
    cleanupMedia,
  };

  const refs: ProctoringRefs = {
    videoRef,
    audioRef,
    canvasRef,
  };

  return { state, actions, refs };
};
