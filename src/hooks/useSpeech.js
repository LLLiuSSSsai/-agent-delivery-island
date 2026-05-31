import { useEffect, useRef } from 'react';

const PHRASES = {
  delivering: '订单派送中',
  confirm: '您有新的外卖订单，请注意查收',
  complete: '订单已完成',
};

// 美团风格：轻快、清晰、偏女性化
const SPEECH_OPTS = {
  'zh-CN': { rate: 1.0, pitch: 1.1, volume: 1 },
  'zh-TW': { rate: 1.0, pitch: 1.1, volume: 1 },
};

// 优先选择的中文语音（Windows 11 常见声音）
const PREFERRED_VOICES = [
  'Microsoft Xiaoxiao',   // Win11 新声音，非常自然
  'Microsoft Yunyang',
  'Microsoft Xiaohan',
  'Microsoft Huihui',     // Win10 声音
  'Microsoft Yaoyao',
  'Microsoft Kangkang',
  'Tingting',
  'Mei-Jia',
];

function findBestVoice(voices) {
  // 按偏好顺序搜索
  for (const name of PREFERRED_VOICES) {
    const match = voices.find(v => v.name.includes(name));
    if (match) return match;
  }
  // fallback: 任意 zh-CN
  return voices.find(v => v.lang.startsWith('zh-CN'))
    || voices.find(v => v.lang.startsWith('zh-TW'))
    || voices.find(v => v.lang.startsWith('zh'));
}

export function useSpeech(status) {
  const prevRef = useRef(null);

  useEffect(() => {
    if (!status || status === 'idle') return;
    if (status === prevRef.current) return;
    prevRef.current = status;

    const phrase = PHRASES[status];
    if (!phrase) return;

    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(phrase);
    utter.lang = 'zh-CN';
    utter.rate = 1.0;
    utter.pitch = 1.1;
    utter.volume = 1;

    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;

      const best = findBestVoice(voices);
      if (best) {
        utter.voice = best;
        utter.lang = best.lang;
        const opts = SPEECH_OPTS[best.lang] || SPEECH_OPTS['zh-CN'];
        utter.rate = opts.rate;
        utter.pitch = opts.pitch;
        utter.volume = opts.volume;
      }

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      trySpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        trySpeak();
      };
    }
  }, [status]);
}
