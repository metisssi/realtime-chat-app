import { useState, useRef, useEffect } from "react";
import { PlayIcon, PauseIcon, Volume2Icon, XIcon } from "lucide-react";
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
            if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
                setAudioDuration(audio.duration);
                setIsLoading(false);
                console.log("Audio duration set:", audio.duration);
            }
        };
        
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        const handleCanPlay = () => {
            console.log("Audio can play");
            setIsLoading(false);
            setError(false);
        };

        const handleLoadedData = () => {
            console.log("Audio loaded data");
            if (audio.duration && !isNaN(audio.duration)) {
                setAudioDuration(audio.duration);
            }
            setIsLoading(false);
        };

        const handleError = (e) => {
            console.error("Audio error details:", {
                error: e,
                audioUrl: audioUrl,
                errorCode: audio.error?.code,
                errorMessage: audio.error?.message
            });
            setError(true);
            setIsLoading(false);
            toast.error("Failed to load audio file");
        };

        audio.addEventListener("timeupdate", updateTime);
        audio.addEventListener("loadedmetadata", updateDuration);
        audio.addEventListener("loadeddata", handleLoadedData);
        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("canplay", handleCanPlay);
        audio.addEventListener("error", handleError);

        // Пробуем загрузить аудио
        audio.load();

        return () => {
            audio.removeEventListener("timeupdate", updateTime);
            audio.removeEventListener("loadedmetadata", updateDuration);
            audio.removeEventListener("loadeddata", handleLoadedData);
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
                console.log("Attempting to play audio:", audioUrl);
                await audio.play();
                setIsPlaying(true);
            }
        } catch (err) {
            console.error("Playback error:", err);
            setError(true);
            toast.error("Failed to play audio: " + err.message);
        }
    };

    const handleSeek = (e) => {
        const audio = audioRef.current;
        if (!audio || error || isLoading) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        const newTime = percentage * audioDuration;
        
        if (isFinite(newTime)) {
            audio.currentTime = newTime;
        }
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
                preload="metadata"
                crossOrigin="anonymous"
            >
                <source src={audioUrl} type="audio/mpeg" />
                <source src={audioUrl} type="audio/mp3" />
                <source src={audioUrl} type="audio/webm" />
                <source src={audioUrl} type="audio/ogg" />
                <source src={audioUrl} type="audio/wav" />
                Your browser does not support the audio element.
            </audio>
            
            <button
                onClick={togglePlayPause}
                disabled={isLoading || error}
                className={`p-2 rounded-full transition-colors flex-shrink-0 ${
                    isSent 
                        ? 'bg-cyan-700 hover:bg-cyan-800' 
                        : 'bg-slate-700 hover:bg-slate-600'
                } ${(isLoading || error) ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={error ? "Audio failed to load" : isLoading ? "Loading..." : "Play/Pause"}
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : error ? (
                    <XIcon className="w-5 h-5 text-red-300" />
                ) : isPlaying ? (
                    <PauseIcon className="w-5 h-5 text-white fill-white" />
                ) : (
                    <PlayIcon className="w-5 h-5 text-white fill-white" />
                )}
            </button>

            <div className="flex-1 space-y-1 min-w-0">
                {error ? (
                    <div className="text-xs text-red-300">Audio unavailable</div>
                ) : (
                    <>
                        <div 
                            className={`h-1 bg-slate-700/30 rounded-full overflow-hidden ${
                                !error && !isLoading ? 'cursor-pointer' : 'cursor-not-allowed'
                            }`}
                            onClick={!error && !isLoading ? handleSeek : undefined}
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
                    </>
                )}
            </div>

            <Volume2Icon className="w-4 h-4 opacity-50 flex-shrink-0" />
        </div>
    );
}

export default AudioMessage;