import { useState, useRef, useEffect } from "react";
import { PlayIcon, PauseIcon } from "lucide-react";

function AudioMessage({ audioUrl, duration, isSent }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [audioDuration, setAudioDuration] = useState(duration || 0);
    const audioRef = useRef(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setAudioDuration(audio.duration);
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener("timeupdate", updateTime);
        audio.addEventListener("loadedmetadata", updateDuration);
        audio.addEventListener("ended", handleEnded);

        return () => {
            audio.removeEventListener("timeupdate", updateTime);
            audio.removeEventListener("loadedmetadata", updateDuration);
            audio.removeEventListener("ended", handleEnded);
        };
    }, []);

    const togglePlayPause = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e) => {
        const audio = audioRef.current;
        if (!audio) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        audio.currentTime = percentage * audioDuration;
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

    return (
        <div className={`flex items-center gap-3 p-3 rounded-lg min-w-[250px] ${
            isSent ? 'bg-cyan-600' : 'bg-slate-800'
        }`}>
            <audio ref={audioRef} src={audioUrl} />
            
            <button
                onClick={togglePlayPause}
                className={`p-2 rounded-full transition-colors ${
                    isSent 
                        ? 'bg-cyan-700 hover:bg-cyan-800' 
                        : 'bg-slate-700 hover:bg-slate-600'
                }`}
            >
                {isPlaying ? (
                    <PauseIcon className="w-5 h-5 text-white" />
                ) : (
                    <PlayIcon className="w-5 h-5 text-white" />
                )}
            </button>

            <div className="flex-1 space-y-1">
                <div 
                    className="h-1 bg-slate-700/30 rounded-full cursor-pointer overflow-hidden"
                    onClick={handleSeek}
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