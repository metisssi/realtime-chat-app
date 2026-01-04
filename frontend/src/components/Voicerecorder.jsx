import { useState, useRef, useEffect } from "react";
import { MicIcon, StopCircleIcon, XIcon } from "lucide-react";
import toast from "react-hot-toast";

function VoiceRecorder({ onAudioReady, onCancel }) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [permissionGranted, setPermissionGranted] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const streamRef = useRef(null);
    const audioContextRef = useRef(null);

    useEffect(() => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast.error("Your browser doesn't support audio recording");
            setPermissionGranted(false);
        }
    }, []);

    // Конвертация в WAV формат
    const convertToWav = async (audioBlob) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const arrayBuffer = reader.result;
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    
                    // Конвертируем в WAV
                    const wavBuffer = audioBufferToWav(audioBuffer);
                    const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
                    
                    resolve(wavBlob);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(audioBlob);
        });
    };

    // Конвертация AudioBuffer в WAV
    const audioBufferToWav = (buffer) => {
        const length = buffer.length * buffer.numberOfChannels * 2 + 44;
        const arrayBuffer = new ArrayBuffer(length);
        const view = new DataView(arrayBuffer);
        const channels = [];
        let offset = 0;
        let pos = 0;

        // WAV header
        const setUint16 = (data) => {
            view.setUint16(pos, data, true);
            pos += 2;
        };
        const setUint32 = (data) => {
            view.setUint32(pos, data, true);
            pos += 4;
        };

        // RIFF identifier
        setUint32(0x46464952);
        // file length
        setUint32(length - 8);
        // RIFF type
        setUint32(0x45564157);
        // format chunk identifier
        setUint32(0x20746d66);
        // format chunk length
        setUint32(16);
        // sample format (raw)
        setUint16(1);
        // channel count
        setUint16(buffer.numberOfChannels);
        // sample rate
        setUint32(buffer.sampleRate);
        // byte rate (sample rate * block align)
        setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels);
        // block align (channel count * bytes per sample)
        setUint16(buffer.numberOfChannels * 2);
        // bits per sample
        setUint16(16);
        // data chunk identifier
        setUint32(0x61746164);
        // data chunk length
        setUint32(length - pos - 4);

        // Write interleaved data
        for (let i = 0; i < buffer.numberOfChannels; i++) {
            channels.push(buffer.getChannelData(i));
        }

        while (pos < length) {
            for (let i = 0; i < buffer.numberOfChannels; i++) {
                let sample = Math.max(-1, Math.min(1, channels[i][offset]));
                sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                view.setInt16(pos, sample, true);
                pos += 2;
            }
            offset++;
        }

        return arrayBuffer;
    };

    const startRecording = async () => {
        try {
            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: { ideal: 48000 }
                }
            };

            console.log("Requesting microphone access...");
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log("Microphone access granted");
            
            streamRef.current = stream;
            setPermissionGranted(true);

            // Приоритет форматам, которые лучше поддерживаются
            const mimeTypes = [
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/ogg;codecs=opus',
                'audio/mp4'
            ];

            let selectedMimeType = '';
            for (const mimeType of mimeTypes) {
                if (MediaRecorder.isTypeSupported(mimeType)) {
                    selectedMimeType = mimeType;
                    console.log("Selected MIME type:", mimeType);
                    break;
                }
            }

            if (!selectedMimeType) {
                throw new Error("No supported audio format found");
            }

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: selectedMimeType,
                audioBitsPerSecond: 128000
            });
            
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    console.log("Audio chunk received:", event.data.size, "bytes");
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                console.log("Recording stopped, total chunks:", audioChunksRef.current.length);
                
                if (audioChunksRef.current.length === 0) {
                    toast.error("No audio data recorded");
                    return;
                }

                const audioBlob = new Blob(audioChunksRef.current, { type: selectedMimeType });
                console.log("Audio blob created:", audioBlob.size, "bytes");

                if (audioBlob.size === 0) {
                    toast.error("Recording failed - no audio data");
                    return;
                }

                try {
                    // Конвертируем в WAV для лучшей совместимости
                    console.log("Converting to WAV...");
                    const wavBlob = await convertToWav(audioBlob);
                    console.log("WAV blob created:", wavBlob.size, "bytes");

                    const reader = new FileReader();
                    reader.onloadend = () => {
                        console.log("Audio converted to base64");
                        onAudioReady({
                            base64: reader.result,
                            duration: recordingTime
                        });
                    };
                    reader.onerror = (error) => {
                        console.error("FileReader error:", error);
                        toast.error("Failed to process audio");
                    };
                    reader.readAsDataURL(wavBlob);
                } catch (conversionError) {
                    console.error("WAV conversion failed, using original:", conversionError);
                    // Если конвертация не удалась, отправляем оригинал
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        onAudioReady({
                            base64: reader.result,
                            duration: recordingTime
                        });
                    };
                    reader.readAsDataURL(audioBlob);
                }
                
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => {
                        console.log("Stopping track:", track.label);
                        track.stop();
                    });
                }
            };

            mediaRecorder.onerror = (event) => {
                console.error("MediaRecorder error:", event.error);
                toast.error("Recording error: " + event.error.name);
            };

            mediaRecorder.start(1000);
            console.log("Recording started, state:", mediaRecorder.state);
            
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    const newTime = prev + 1;
                    console.log("Recording time:", newTime);
                    return newTime;
                });
            }, 1000);

            toast.success("Recording started");

        } catch (error) {
            console.error("Error accessing microphone:", error);
            setPermissionGranted(false);
            
            let errorMessage = "Could not access microphone";
            
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage = "Microphone permission denied. Please allow microphone access in browser settings.";
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorMessage = "No microphone found. Please connect a microphone.";
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMessage = "Microphone is being used by another application.";
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            toast.error(errorMessage);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            console.log("Stopping recording...");
            
            if (mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    const cancelRecording = () => {
        console.log("Canceling recording...");
        
        if (mediaRecorderRef.current && isRecording) {
            if (mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.ondataavailable = null;
                mediaRecorderRef.current.onstop = null;
                mediaRecorderRef.current.stop();
            }
            
            setIsRecording(false);
            clearInterval(timerRef.current);
            
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        }
        
        onCancel();
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
            {!isRecording ? (
                <button
                    onClick={startRecording}
                    disabled={permissionGranted === false}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <MicIcon className="w-5 h-5" />
                    <span>Start Recording</span>
                </button>
            ) : (
                <>
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-slate-200 font-medium">
                            {formatTime(recordingTime)}
                        </span>
                        <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-red-500 transition-all duration-300"
                                style={{ width: `${Math.min((recordingTime / 60) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                    
                    <button
                        onClick={stopRecording}
                        className="bg-cyan-500 hover:bg-cyan-600 text-white p-2 rounded-lg transition-colors"
                        title="Stop and send"
                    >
                        <StopCircleIcon className="w-5 h-5" />
                    </button>
                    
                    <button
                        onClick={cancelRecording}
                        className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg transition-colors"
                        title="Cancel recording"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </>
            )}
            
            {permissionGranted === false && (
                <p className="text-xs text-red-400 ml-2">
                    Microphone access required
                </p>
            )}
        </div>
    );
}

export default VoiceRecorder;