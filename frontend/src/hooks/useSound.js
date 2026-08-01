import { useMemo } from "react";

export default function useSound() {

    const success = useMemo(
        () => new Audio("/sounds/success.mp3"),
        []
    );

    const error = useMemo(
        () => new Audio("/sounds/error.mp3"),
        []
    );

    const location = useMemo(
        () => new Audio("/sounds/location.mp3"),
        []
    );

    const completed = useMemo(
        () => new Audio("/sounds/completed.mp3"),
        []
    );

    const play = (audio) => {

        audio.currentTime = 0;

        audio.play().catch(() => {});

        if ("vibrate" in navigator) {

            navigator.vibrate(60);

        }

    };

    return {

        successBeep: () => play(success),

        errorBeep: () => play(error),

        locationBeep: () => play(location),

        completedBeep: () => play(completed)

    };

}