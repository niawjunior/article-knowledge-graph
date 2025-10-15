"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  Loader2,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
} from "lucide-react";

interface StoryChapter {
  chapter: number;
  title: string;
  narrative: string;
  entityIds: string[];
  duration: number;
}

interface StoryPlayerProps {
  articleId: string;
  onHighlight: (nodeIds: string[]) => void;
  onClose: () => void;
}

export default function StoryPlayer({
  articleId,
  onHighlight,
  onClose,
}: StoryPlayerProps) {
  const [story, setStory] = useState<StoryChapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const onHighlightRef = useRef(onHighlight);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPlayedChapterRef = useRef<number>(-1);
  const isFetchingRef = useRef(false);

  // Keep ref updated
  useEffect(() => {
    onHighlightRef.current = onHighlight;
  }, [onHighlight]);

  // Fetch story only once per article (with caching)
  useEffect(() => {
    const cacheKey = `story-${articleId}`;

    const fetchStory = async () => {
      // Prevent duplicate fetches
      if (isFetchingRef.current) {
        return;
      }

      try {
        // Check if story is cached in sessionStorage
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const cachedData = JSON.parse(cached);
          setStory(cachedData);
          setIsLoading(false);
          return;
        }

        // Mark as fetching
        isFetchingRef.current = true;

        // Fetch from API if not cached
        const response = await fetch(`/api/articles/${articleId}/story`);
        if (!response.ok) throw new Error("Failed to fetch story");
        const data = await response.json();

        // Cache the story
        sessionStorage.setItem(cacheKey, JSON.stringify(data.story));

        setStory(data.story);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching story:", error);
        setIsLoading(false);
      } finally {
        isFetchingRef.current = false;
      }
    };

    fetchStory();
  }, [articleId]);

  // Highlight entities when chapter changes
  useEffect(() => {
    if (story.length === 0) return;
    const chapter = story[currentChapter];
    if (chapter && chapter.entityIds.length > 0) {
      onHighlightRef.current(chapter.entityIds);
    }
  }, [currentChapter, story]);

  // Generate and play audio in real-time when chapter changes
  useEffect(() => {
    if (!audioEnabled || story.length === 0 || !isPlaying) {
      // Stop audio if conditions not met
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }

    let isCancelled = false;

    const playAudio = async () => {
      try {
        // Get chapter from story at the time of execution
        if (
          !story ||
          story.length === 0 ||
          !story[currentChapter] ||
          isCancelled
        )
          return;

        // Check if we already played this chapter
        if (
          lastPlayedChapterRef.current === currentChapter &&
          audioRef.current
        ) {
          // Resume existing audio instead of regenerating
          try {
            await audioRef.current.play();
            return;
          } catch (error) {
            // If resume fails, regenerate
            console.log("Resume failed, regenerating audio");
          }
        }

        const chapter = story[currentChapter];

        setIsGeneratingAudio(true);
        lastPlayedChapterRef.current = currentChapter;

        // Stop previous audio if playing
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current = null;
        }

        // Stream audio from API
        const response = await fetch(`/api/articles/${articleId}/story/audio`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: chapter.narrative,
          }),
        });

        if (!response.ok || isCancelled) {
          throw new Error("Failed to generate audio");
        }

        // Create blob URL from streaming response
        const blob = await response.blob();

        if (isCancelled) {
          return;
        }

        const audioUrl = URL.createObjectURL(blob);

        // Create and play audio
        const audio = new Audio(audioUrl);

        if (isCancelled) {
          URL.revokeObjectURL(audioUrl);
          return;
        }

        audioRef.current = audio;

        // Wait for metadata to get duration
        audio.addEventListener("loadedmetadata", () => {
          if (!isCancelled) {
            setIsGeneratingAudio(false);
            // Note: We don't update story state here to avoid re-triggering the effect
          }
        });

        // Handle audio end - move to next chapter
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          if (!isCancelled && isPlaying && currentChapter < story.length - 1) {
            setCurrentChapter((prev) => prev + 1);
            setProgress(0);
          } else if (currentChapter === story.length - 1) {
            setIsPlaying(false);
            setProgress(100);
          }
        };

        // Play audio only if not cancelled
        if (!isCancelled) {
          try {
            await audio.play();
          } catch (playError) {
            console.error("Play error:", playError);
            setIsGeneratingAudio(false);
          }
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Error playing audio:", error);
          setIsGeneratingAudio(false);
        }
      }
    };

    playAudio();

    return () => {
      isCancelled = true;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsGeneratingAudio(false);
    };
  }, [currentChapter, audioEnabled, isPlaying, articleId]);

  // Auto-play chapter with progress synced to audio
  useEffect(() => {
    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    if (!isPlaying || story.length === 0) return;

    const chapter = story[currentChapter];
    if (!chapter) {
      setIsPlaying(false);
      return;
    }

    // Reset progress when starting a new chapter
    setProgress(0);

    // If audio is enabled, sync progress with audio playback
    if (audioEnabled) {
      const updateProgress = () => {
        const audio = audioRef.current;
        if (audio && audio.duration && !isNaN(audio.duration)) {
          const progressPercent = (audio.currentTime / audio.duration) * 100;
          setProgress(progressPercent);
        }
      };

      // Update progress as audio plays
      progressIntervalRef.current = setInterval(updateProgress, 100);
    } else {
      // Fallback: Use fixed duration if audio is disabled
      const duration = chapter.duration || 5000;
      const interval = 50;
      const steps = duration / interval;
      let step = 0;

      progressIntervalRef.current = setInterval(() => {
        step++;
        const newProgress = (step / steps) * 100;
        setProgress(newProgress);

        if (step >= steps) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          // Move to next chapter only if audio is disabled
          if (currentChapter < story.length - 1) {
            setCurrentChapter((prev) => prev + 1);
          } else {
            setIsPlaying(false);
            setProgress(100);
          }
        }
      }, interval);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [isPlaying, currentChapter, story, audioEnabled]);

  const handlePlayPause = () => {
    if (isPlaying) {
      // Pause
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else {
      // Resume
      setIsPlaying(true);
      if (audioRef.current && audioEnabled) {
        audioRef.current.play().catch(console.error);
      }
    }
  };

  const handleNext = () => {
    if (currentChapter < story.length - 1) {
      setCurrentChapter((prev) => prev + 1);
      setProgress(0);
    }
  };

  const handlePrevious = () => {
    if (currentChapter > 0) {
      setCurrentChapter((prev) => prev - 1);
      setProgress(0);
    }
  };

  const handleChapterClick = (index: number) => {
    setCurrentChapter(index);
    setProgress(0);
    setIsPlaying(false);
  };

  if (isLoading) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-slate-800 text-white p-6 shadow-2xl border-t border-slate-700 z-50">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center gap-3">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-lg">Generating your story...</p>
          </div>
        </div>
      </div>
    );
  }

  if (story.length === 0) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-slate-800 text-white p-6 shadow-2xl border-t border-slate-700 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <p className="text-lg">Failed to generate story</p>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  const chapter = story[currentChapter];

  // Minimized view
  if (isMinimized) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-slate-800 text-white shadow-2xl border-t border-slate-700 z-50">
        {/* Progress Bar */}
        <div className="h-1 bg-slate-700">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
          {/* Play/Pause */}
          <button
            onClick={handlePlayPause}
            className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-full transition-all"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>

          {/* Chapter info */}
          <div className="flex-1">
            <p className="text-sm font-medium truncate">{chapter.title}</p>
            <p className="text-xs text-slate-400">
              Chapter {chapter.chapter} of {story.length} •{" "}
              {Math.round(progress)}% complete
            </p>
          </div>

          {/* Audio toggle */}
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-2 rounded-full transition-colors ${
              audioEnabled
                ? "bg-blue-600 hover:bg-blue-500"
                : "bg-slate-700 hover:bg-slate-600"
            }`}
            title={audioEnabled ? "Mute" : "Unmute"}
          >
            {audioEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* Maximize */}
          <button
            onClick={() => setIsMinimized(false)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            title="Expand"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Full view
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-800 to-slate-900/95 text-white shadow-2xl border-t border-slate-700 z-50">
      {/* Progress Bar */}
      <div className="h-1 bg-slate-700">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Control Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            title="Minimize"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            title="Close Story"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chapter Content */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-semibold text-blue-400 uppercase tracking-wider">
              Chapter {chapter.chapter} of {story.length}
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-blue-500/50 to-transparent" />
          </div>
          <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {chapter.title}
          </h2>
          <p className="text-lg leading-relaxed text-slate-200">
            {chapter.narrative}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handlePrevious}
            disabled={currentChapter === 0}
            className="p-3 bg-slate-700 hover:bg-slate-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous Chapter"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={handlePlayPause}
            className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-full transition-all shadow-lg"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </button>

          <button
            onClick={handleNext}
            disabled={currentChapter === story.length - 1}
            className="p-3 bg-slate-700 hover:bg-slate-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next Chapter"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-3 rounded-full transition-colors ${
              audioEnabled
                ? "bg-blue-600 hover:bg-blue-500"
                : "bg-slate-700 hover:bg-slate-600"
            }`}
            title={audioEnabled ? "Mute Narration" : "Enable Narration"}
          >
            {audioEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </button>

          <div className="flex-1" />

          {isGeneratingAudio && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating audio...</span>
            </div>
          )}

          <div className="text-sm text-slate-400">
            {Math.round(progress)}% complete
          </div>
        </div>

        {/* Chapter Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {story.map((ch, index) => (
            <button
              key={index}
              onClick={() => handleChapterClick(index)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                index === currentChapter
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                  : index < currentChapter
                  ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {index + 1}. {ch.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
