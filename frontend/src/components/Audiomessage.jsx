import { useState, useRef, useEffect } from "react";
import { PlayIcon, PauseIcon } from "lucide-react";
import toast from "react-hot-toast";

function AudioMessage({ audioUrl, duration, isSent }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [audioDuration, setAudioDuration] = useState(duration || 0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);
    const audioRef = useRef(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        
        const updateDuration = () => {
            if (audio.duration && !isNaN(audio.duration)) {
                setAudioDuration(audio.duration);
            }
            setIsLoading(false);
        };
        
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        const handleCanPlay = () => {
            setIsLoading(false);
            setError(false);
        };

        const handleError = (e) => {
            console.error("Audio error:", e);
            setError(true);
            setIsLoading(false);
            toast.error("Failed to load audio");
        };

        audio.addEventListener("timeupdate", updateTime);
        audio.addEventListener("loadedmetadata", updateDuration);
        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("canplay", handleCanPlay);
        audio.addEventListener("error", handleError);

        return () => {
            audio.removeEventListener("timeupdate", updateTime);
            audio.removeEventListener("loadedmetadata", updateDuration);
            audio.removeEventListener("ended", handleEnded);
            audio.removeEventListener("canplay", handleCanPlay);
            audio.removeEventListener("error", handleError);
        };
    }, [audioUrl]);

    const togglePlayPause = async () => {
        const audio = audioRef.current;
        if (!audio || error) return;

        try {
            if (isPlaying) {
                audio.pause();
                setIsPlaying(false);
            } else {
                await audio.play();
                setIsPlaying(true);
            }
        } catch (err) {
            console.error("Playback error:", err);
            setError(true);
            toast.error("Failed to play audio");
        }
    };

    const handleSeek = (e) => {
        const audio = audioRef.current;
        if (!audio || error) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        audio.currentTime = percentage * audioDuration;
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

    return (
        <div className={`flex items-center gap-3 p-3 rounded-lg min-w-[250px] ${
            isSent ? 'bg-cyan-600' : 'bg-slate-800'
        }`}>
            <audio 
                ref={audioRef} 
                src={audioUrl}
                preload="metadata"
            />
            
            <button
                onClick={togglePlayPause}
                disabled={isLoading || error}
                className={`p-2 rounded-full transition-colors ${
                    isSent 
                        ? 'bg-cyan-700 hover:bg-cyan-800' 
                        : 'bg-slate-700 hover:bg-slate-600'
                } ${(isLoading || error) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : error ? (
                    <span className="text-xs">❌</span>
                ) : isPlaying ? (
                    <PauseIcon className="w-5 h-5 text-white" />
                ) : (
                    <PlayIcon className="w-5 h-5 text-white" />
                )}
            </button>

            <div className="flex-1 space-y-1">
                <div 
                    className={`h-1 bg-slate-700/30 rounded-full overflow-hidden ${
                        !error ? 'cursor-pointer' : 'cursor-not-allowed'
                    }`}
                    onClick={!error ? handleSeek : undefined}
                >
                    <div 
                        className={`h-full rounded-full transition-all ${
                            isSent ? 'bg-white' : 'bg-cyan-500'
                        }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between text-xs opacity-75">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(audioDuration)}</span>
                </div>
            </div>
        </div>
    );
}

export default AudioMessage;