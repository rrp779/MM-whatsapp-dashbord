// src/utils/notificationManager.ts

let audio: HTMLAudioElement | null = null;
let isUnlocked = false;
let lastPlayed = 0;

export const initNotificationSound = () => {
  audio = new Audio('/sounds/notification.mp3');
  audio.preload = 'auto';

  const unlock = () => {
    if (!audio) return;

    audio.play()
      .then(() => {
        audio?.pause();
        audio.currentTime = 0;
        isUnlocked = true;
        console.log("🔓 Audio unlocked");
      })
      .catch(() => {});

    window.removeEventListener('click', unlock);
  };

  window.addEventListener('click', unlock);
};

export const playSound = () => {
  const audio = new Audio('/sounds/notification.mp3'); // 🔥 NEW instance every time
  audio.volume = 1;

  audio.play()
    .then(() => {
      console.log("🔊 SOUND PLAYED");
    })
    .catch((err) => {
      console.log("🔇 SOUND FAILED:", err);
    });
};

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return;

  if (Notification.permission !== "granted") {
    await Notification.requestPermission();
  }
};

export const showNotification = (
  title: string,
  body: string,
  onClick?: () => void
) => {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const notification = new Notification(title, {
    body,
    icon: "/icons/chat-icon.png",
  });

  notification.onclick = () => {
    window.focus();
    onClick?.();
  };
};