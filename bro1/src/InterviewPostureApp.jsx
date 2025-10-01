// App.jsx - MediaRecorder 기반 자세 분석 + 음성 분석 통합 시스템 (마이크 테스트 포함)
import React, { useState, useEffect, useRef } from 'react';
import '../src/interview.css';

const BASE_URL = 'http://192.168.0.6:5001';

// SVG 아이콘들
const Camera = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const AlertCircle = ({ className = "" }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const VolumeX = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

const Volume2 = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

const MessageSquare = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const Brain = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2a3 3 0 0 0-3 3 4 4 0 0 0-4 4v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9a4 4 0 0 0-4-4 3 3 0 0 0-3-3z" />
    <path d="M12 9v4" />
    <path d="M12 17v.01" />
  </svg>
);

const Mic = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const MicOff = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
    <path d="M15 9.34V5a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2" />
    <path d="M19 10v2a7 7 0 0 1-.11 1.23" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const BarChart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

export default function InterviewPostureVoiceApp() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isServerConnected, setIsServerConnected] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [realtimeData, setRealtimeData] = useState(null);
  const [currentIssues, setCurrentIssues] = useState([]);
  const [postureScore, setPostureScore] = useState(100);
  const [isOverlayMode, setIsOverlayMode] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    orientation: 'portrait'
  });
  
  // 음성 관련 상태
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceAnalysisEnabled, setVoiceAnalysisEnabled] = useState(true);
  const [voiceAnalysisActive, setVoiceAnalysisActive] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [voiceAnalysisReport, setVoiceAnalysisReport] = useState(null);
  const [showVoiceReport, setShowVoiceReport] = useState(false);
  
  // 🔧 추가: 마이크 테스트 상태
  const [micTestActive, setMicTestActive] = useState(false);
  const [micTestResults, setMicTestResults] = useState(null);
  
  // 면접 관련 상태
  const [interviewData, setInterviewData] = useState({
    active: false,
    current_question: null,
    category: null,
    question_number: 0,
    total_questions: 0,
    phase: 'thinking',
    time_remaining: 0,
    current_stage: null
  });
  
  const imgRef = useRef(null);
  const eventSourceRef = useRef(null);
  const lastSpokenIssueRef = useRef('');
  const lastIssueTimeRef = useRef({});
  const lastQuestionRef = useRef('');
  
  // MediaRecorder 관련 refs
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const chunkCountRef = useRef(0);
  const voiceLevelIntervalRef = useRef(null);
  
  // 🔧 추가: 마이크 테스트 관련 refs
  const micTestIntervalRef = useRef(null);
  const micTestAudioContextRef = useRef(null);

  // Web Speech API 초기화
  const initSpeechSynthesis = () => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = speechSynthesis.getVoices();
    
        return voices;
      };

      if (speechSynthesis.getVoices().length === 0) {
        speechSynthesis.addEventListener('voiceschanged', loadVoices, { once: true });
      }
      
      return true;
    }
    console.warn('❌ Web Speech API를 지원하지 않는 브라우저입니다.');
    return false;
  };

  // 음성 인식 초기화
  const initSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('❌ Speech Recognition API를 지원하지 않는 브라우저입니다.');
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ko-KR';
    
    let finalTranscript = '';
    
    recognition.onresult = (event) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
          sendSpeechTextToServer(transcript.trim());
        } else {
          interimTranscript += transcript;
        }
      }
    };
    
    recognition.onerror = (event) => {
      console.error('음성 인식 오류:', event.error);
      if (event.error === 'not-allowed') {
        alert('마이크 권한이 필요합니다. 브라우저 설정에서 마이크를 허용해주세요.');
      }
    };
    
    recognition.onend = () => {
      if (voiceAnalysisActive && interviewData.active) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            console.warn('음성 인식 재시작 실패:', e);
          }
        }, 100);
      }
    };
    
    speechRecognitionRef.current = recognition;
    return true;
  };

  // 🔧 새로운: 종합 마이크 테스트 함수
  const runMicrophoneTest = async () => {
    try {
      console.log('🧪 종합 마이크 테스트 시작...');
      setMicTestActive(true);
      setMicTestResults(null);
      
      // 1. 기본 권한 및 디바이스 확인
      console.log('1️⃣ 마이크 권한 및 디바이스 확인...');
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      console.log('🎤 발견된 오디오 입력 장치:', audioDevices);
      
      if (audioDevices.length === 0) {
        throw new Error('마이크 디바이스를 찾을 수 없습니다.');
      }
      
      // 2. 스트림 획득 테스트
      console.log('2️⃣ 마이크 스트림 획득 테스트...');
      
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const audioTrack = stream.getAudioTracks()[0];
      
      console.log('📊 오디오 트랙 정보:', {
        label: audioTrack.label,
        enabled: audioTrack.enabled,
        muted: audioTrack.muted,
        readyState: audioTrack.readyState,
        settings: audioTrack.getSettings()
      });
      
      // 3. AudioContext 테스트
      console.log('3️⃣ AudioContext 실시간 분석 테스트...');
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('🎛️ AudioContext 상태:', audioContext.state);
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('🔄 AudioContext 활성화 완료');
      }
      
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const timeDataArray = new Float32Array(analyser.fftSize);
      
      micTestAudioContextRef.current = audioContext;
      
      // 4. 실시간 볼륨 모니터링 (10초간)
      console.log('4️⃣ 10초간 실시간 볼륨 모니터링...');
      console.log('🗣️ 지금 마이크에 말해보세요!');
      
      let testCount = 0;
      let maxVolume = 0;
      let avgVolume = 0;
      let volumeSum = 0;
      let signalCount = 0;
      const testDuration = 10000; // 10초
      const intervalMs = 100;
      const maxCount = testDuration / intervalMs;
      
      const testResults = {
        maxVolume: 0,
        avgVolume: 0,
        signalDetected: false,
        samples: [],
        deviceInfo: {
          audioDevices: audioDevices.length,
          deviceLabel: audioTrack.label,
          sampleRate: audioTrack.getSettings().sampleRate
        }
      };
      
      micTestIntervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        analyser.getFloatTimeDomainData(timeDataArray);
        
        // 주파수 도메인 볼륨 계산
        const freqSum = dataArray.reduce((a, b) => a + b, 0);
        const freqAvg = freqSum / bufferLength;
        const freqVolume = (freqAvg / 128) * 100;
        
        // 시간 도메인 볼륨 계산 (RMS)
        const rms = Math.sqrt(timeDataArray.reduce((sum, val) => sum + val * val, 0) / timeDataArray.length);
        const rmsVolume = Math.min(100, rms * 1000);
        
        // 신호 감지
        const hasSignal = rms > 0.001 || freqAvg > 5;
        
        if (hasSignal) {
          signalCount++;
          testResults.signalDetected = true;
        }
        
        const currentVolume = Math.max(freqVolume, rmsVolume);
        maxVolume = Math.max(maxVolume, currentVolume);
        volumeSum += currentVolume;
        
        // 실시간 UI 업데이트
        setVoiceLevel(currentVolume);
        
        // 샘플 저장
        testResults.samples.push({
          time: testCount * intervalMs,
          freqVolume,
          rmsVolume,
          hasSignal,
          freqAvg,
          rms: rms * 1000
        });
        
        if (testCount % 10 === 0) {
          console.log(`🔊 테스트 ${testCount}/${maxCount}: 주파수=${freqVolume.toFixed(1)}%, RMS=${rmsVolume.toFixed(1)}%, 신호=${hasSignal ? '✅' : '❌'}`);
        }
        
        testCount++;
        
        if (testCount >= maxCount) {
          // 테스트 완료
          clearInterval(micTestIntervalRef.current);
          
          testResults.maxVolume = maxVolume;
          testResults.avgVolume = volumeSum / testCount;
          testResults.signalRatio = (signalCount / testCount) * 100;
          
          console.log('🏁 마이크 테스트 완료:', testResults);
          
          // 정리
          stream.getTracks().forEach(track => track.stop());
          audioContext.close();
          
          setMicTestActive(false);
          setMicTestResults(testResults);
          setVoiceLevel(0);
          
          // 테스트 결과 분석
          analyzeMicTestResults(testResults);
        }
      }, intervalMs);
      
    } catch (error) {
      console.error('❌ 마이크 테스트 실패:', error);
      setMicTestActive(false);
      setMicTestResults({ error: error.message });
      
      let errorMessage = '마이크 테스트 실패:\n\n';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += '🔒 마이크 권한이 거부되었습니다.\n\n해결방법:\n1. 브라우저 주소창 왼쪽 자물쇠 아이콘 클릭\n2. 마이크 권한을 "허용"으로 변경\n3. 페이지 새로고침';
      } else if (error.name === 'NotFoundError') {
        errorMessage += '🎤 마이크를 찾을 수 없습니다.\n\n확인사항:\n1. 마이크가 컴퓨터에 연결되어 있는지\n2. 다른 앱에서 마이크를 사용 중인지\n3. 시스템 사운드 설정 확인';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += '🚫 이 브라우저는 마이크를 지원하지 않습니다.\n\nChrome, Firefox, Safari를 사용해주세요.';
      } else {
        errorMessage += `❌ ${error.message}\n\n브라우저 콘솔을 확인해주세요.`;
      }
      
      alert(errorMessage);
    }
  };

  // 🔧 테스트 결과 분석 함수
  const analyzeMicTestResults = (results) => {
    if (results.error) {
      console.error('테스트 실패:', results.error);
      return;
    }
    
    console.log('📊 마이크 테스트 결과 분석:');
    console.log(`   최대 볼륨: ${results.maxVolume.toFixed(1)}%`);
    console.log(`   평균 볼륨: ${results.avgVolume.toFixed(1)}%`);
    console.log(`   신호 감지율: ${results.signalRatio.toFixed(1)}%`);
    console.log(`   신호 감지: ${results.signalDetected ? '✅' : '❌'}`);
    
    let diagnosis = '🩺 마이크 진단 결과:\n\n';
    let recommendations = [];
    
    if (!results.signalDetected) {
      diagnosis += '❌ 마이크에서 신호를 감지할 수 없습니다.\n';
      recommendations.push('마이크가 음소거되어 있는지 확인');
      recommendations.push('마이크에 말해보기');
      recommendations.push('마이크 볼륨 설정 확인');
      recommendations.push('다른 앱에서 마이크 사용 중인지 확인');
    } else if (results.maxVolume < 5) {
      diagnosis += '⚠️ 마이크 볼륨이 매우 낮습니다.\n';
      recommendations.push('시스템 마이크 볼륨 증가');
      recommendations.push('마이크에 더 가까이 말하기');
      recommendations.push('주변 소음 확인');
    } else if (results.maxVolume < 20) {
      diagnosis += '📈 마이크 볼륨이 낮습니다.\n';
      recommendations.push('좀 더 크게 말해보기');
      recommendations.push('마이크와의 거리 조절');
    } else if (results.maxVolume > 80) {
      diagnosis += '🔊 마이크 볼륨이 높습니다.\n';
      recommendations.push('마이크 볼륨을 조금 낮춰보세요');
      recommendations.push('마이크와의 거리를 늘려보세요');
    } else {
      diagnosis += '✅ 마이크가 정상적으로 작동합니다!\n';
      recommendations.push('면접을 시작할 수 있습니다');
    }
    
    // 디바이스 정보 추가
    diagnosis += `\n📱 디바이스 정보:\n`;
    diagnosis += `   감지된 마이크: ${results.deviceInfo.audioDevices}개\n`;
    diagnosis += `   사용 중인 마이크: ${results.deviceInfo.deviceLabel}\n`;
    diagnosis += `   샘플레이트: ${results.deviceInfo.sampleRate}Hz\n`;
    
    if (recommendations.length > 0) {
      diagnosis += '\n💡 권장사항:\n';
      recommendations.forEach((rec, idx) => {
        diagnosis += `${idx + 1}. ${rec}\n`;
      });
    }
    
    alert(diagnosis);
  };

  // 🔧 마이크 테스트 중지 함수
  const stopMicTest = () => {
    if (micTestIntervalRef.current) {
      clearInterval(micTestIntervalRef.current);
      micTestIntervalRef.current = null;
    }
    
    if (micTestAudioContextRef.current) {
      micTestAudioContextRef.current.close();
      micTestAudioContextRef.current = null;
    }
    
    setMicTestActive(false);
    setVoiceLevel(0);
    console.log('🛑 마이크 테스트 중지됨');
  };

  // playBeep 함수를 stopMicTest() 함수 아래에 추가
const playBeep = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      console.log('🔔 답변 시작 신호음');
    } catch (error) {
      console.error('신호음 재생 실패:', error);
    }
  };

  // MediaRecorder 초기화
  const initMediaRecorderAnalysis = async () => {
    try {
      console.log('🎤 MediaRecorder 초기화 시작...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log('✅ 마이크 스트림 획득 성공');
      console.log('📊 스트림 정보:', {
        tracks: stream.getAudioTracks().length,
        active: stream.active,
        settings: stream.getAudioTracks()[0]?.getSettings()
      });
      
      // 🔧 추가: 오디오 트랙 상태 확인
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        console.log('🎵 오디오 트랙 상태:', {
          enabled: audioTrack.enabled,
          muted: audioTrack.muted,
          readyState: audioTrack.readyState,
          label: audioTrack.label
        });
        
        // 트랙 이벤트 리스너
        audioTrack.onended = () => console.log('🛑 오디오 트랙 종료됨');
        audioTrack.onmute = () => console.log('🔇 오디오 트랙 음소거됨');
        audioTrack.onunmute = () => console.log('🔊 오디오 트랙 음소거 해제됨');
      }
      
      mediaStreamRef.current = stream;
      
      // MediaRecorder 설정
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/wav';
          }
        }
      }
      
      console.log('🎵 사용할 오디오 형식:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000
      });
      
      let audioChunks = [];
      chunkCountRef.current = 0;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunkCountRef.current++;
          console.log(`📦 오디오 청크 수신 #${chunkCountRef.current} - 크기: ${event.data.size} bytes`);
          
          audioChunks.push(event.data);
          
          // 🔧 수정: 즉시 전송 (상태 체크 전에)
          // MediaRecorder가 활성 상태일 때만 생성되므로 안전함
          sendAudioChunkToServer(event.data, chunkCountRef.current).catch(err => {
            console.error(`❌ 청크 #${chunkCountRef.current} 전송 실패:`, err);
          });
        } else {
          console.warn(`⚠️ 빈 청크 감지 #${chunkCountRef.current}`);
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log(`🛑 MediaRecorder 중지 - 총 ${chunkCountRef.current}개 청크 수집`);
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        console.log('📊 최종 오디오 파일 크기:', audioBlob.size, 'bytes');
        
        sendFinalAudioToServer(audioBlob);
        audioChunks = [];
        chunkCountRef.current = 0;
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder 오류:', event.error);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      
      console.log('🎉 MediaRecorder 초기화 완료!');
      return true;
      
    } catch (error) {
      console.error('❌ MediaRecorder 초기화 실패:', error);
      
      let errorMessage = '';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = `🔒 마이크 권한이 거부되었습니다.\n\n해결 방법:\n1. 브라우저 주소창 왼쪽 🔒 아이콘 클릭\n2. 마이크 권한을 "허용"으로 변경\n3. 페이지 새로고침`;
      } else if (error.name === 'NotFoundError') {
        errorMessage = '🎤 마이크를 찾을 수 없습니다. 마이크 연결을 확인해주세요.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = '🚫 MediaRecorder를 지원하지 않는 브라우저입니다. Chrome, Firefox, Safari를 사용해주세요.';
      } else {
        errorMessage = `❌ 마이크 오류: ${error.message}`;
      }
      
      alert(errorMessage);
      return false;
    }
  };

// 🔧 새로운: 실시간 오디오 분석기 추가
const initRealTimeAudioAnalyzer = async () => {
    if (!mediaStreamRef.current) {
      console.error('❌ 미디어 스트림이 없습니다.');
      return false;
    }
    
    try {
      console.log('🎛️ 실시간 오디오 분석기 초기화 시작...');
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('📊 AudioContext 생성:', audioContext.state);
      
      // AudioContext가 suspended 상태면 resume
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('🔄 AudioContext resume 완료:', audioContext.state);
      }
      
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(mediaStreamRef.current);
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      console.log('✅ 오디오 분석기 설정 완료 - 버퍼 크기:', bufferLength);
      
      let frameCount = 0;
      
      const updateVolume = () => {
        // voiceAnalysisActive 체크를 제거하고 항상 실행
        analyser.getByteFrequencyData(dataArray);
        
        // 볼륨 계산
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const average = sum / bufferLength;
        const volume = Math.min(100, (average / 128) * 100);
        
        setVoiceLevel(volume);
        
        frameCount++;
        
        // 로그 (매 100프레임마다, 약 1.6초)
        if (frameCount % 100 === 0) {
          console.log(`🔊 실시간 볼륨: ${volume.toFixed(1)}% (평균: ${average.toFixed(1)}, 합계: ${sum})`);
        }
        
        // 계속 실행
        requestAnimationFrame(updateVolume);
      };
      
      updateVolume();
      console.log('🎤 실시간 볼륨 모니터링 시작!');
      
      // 정리용으로 저장
      voiceLevelIntervalRef.current = audioContext;
      
      return true;
      
    } catch (error) {
      console.error('❌ 실시간 오디오 분석기 초기화 실패:', error);
      return false;
    }
  };


  const stopVoiceLevelSimulation = () => {
    if (voiceLevelIntervalRef.current) {
      // AudioContext인 경우 close, interval인 경우 clear
      if (typeof voiceLevelIntervalRef.current.close === 'function') {
        voiceLevelIntervalRef.current.close();
      } else {
        clearInterval(voiceLevelIntervalRef.current);
      }
      voiceLevelIntervalRef.current = null;
    }
    setVoiceLevel(0);
  };

  const sendAudioChunkToServer = async (audioBlob, chunkNumber) => {
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('chunk_number', chunkNumber);
      formData.append('timestamp', Date.now());
      formData.append('question_number', interviewData.question_number || 0);
      formData.append('phase', interviewData.phase || 'unknown');
      
      console.log(`📤 청크 #${chunkNumber} 전송 중... (${audioBlob.size} bytes)`);
      
      const response = await fetch(`${BASE_URL}/voice/audio_chunk_blob`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ 청크 #${chunkNumber} 전송 성공:`, result);
      } else {
        console.error(`❌ 청크 #${chunkNumber} 전송 실패:`, response.status);
      }
      
    } catch (error) {
      console.error(`❌ 청크 #${chunkNumber} 전송 오류:`, error);
    }
  };

  // 최종 오디오 파일 전송
  const sendFinalAudioToServer = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('final_audio', audioBlob);
      formData.append('timestamp', Date.now());
      
      console.log('📤 최종 오디오 파일 전송 중...', audioBlob.size, 'bytes');
      
      const response = await fetch(`${BASE_URL}/voice/final_audio`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        console.log('✅ 최종 오디오 파일 전송 성공');
      } else {
        console.error('❌ 최종 오디오 파일 전송 실패:', response.status);
      }
      
    } catch (error) {
      console.error('❌ 최종 오디오 파일 전송 오류:', error);
    }
  };

  // 서버로 음성 텍스트 전송
  const sendSpeechTextToServer = async (text) => {
    if (!voiceAnalysisActive || !interviewData.active || !text.trim()) return;
    
    try {
      console.log('📝 음성 텍스트 전송:', text);
      await fetch(`${BASE_URL}/voice/speech_text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          timestamp: Date.now(),
          question_number: interviewData.question_number,
          phase: interviewData.phase
        })
      });
    } catch (error) {
      console.error('음성 텍스트 전송 실패:', error);
    }
  };

  // 음성 분석 시작 함수
  const startVoiceAnalysisSession = async () => {
    if (!voiceAnalysisEnabled) {
      console.log('❌ 음성 분석이 비활성화되어 있습니다.');
      return false;
    }
    
    console.log('🎤 MediaRecorder 음성 분석 세션 시작...');
    setVoiceAnalysisActive(true);
    
    // MediaRecorder 초기화
    const success = await initMediaRecorderAnalysis();
    
    if (success && mediaRecorderRef.current) {
      try {
        // MediaRecorder 시작
        mediaRecorderRef.current.start(100);
        console.log('✅ MediaRecorder 녹음 시작 (100ms 청크)');
        
        // 🔧 추가: 실시간 오디오 분석기 시작
        await initRealTimeAudioAnalyzer();
        
        // 음성 인식 시작
        if (speechRecognitionRef.current) {
          speechRecognitionRef.current.start();
          console.log('✅ 음성 인식 시작');
        }
        
        return true;
      } catch (error) {
        console.error('❌ MediaRecorder 시작 실패:', error);
        setVoiceAnalysisActive(false);
        return false;
      }
    } else {
      console.error('❌ MediaRecorder 초기화 실패');
      setVoiceAnalysisActive(false);
      return false;
    }
  };

  // 음성 분석 중지
  const stopVoiceAnalysis = () => {
    console.log('🛑 MediaRecorder 음성 분석 중지 시작...');
    setVoiceAnalysisActive(false);
    
    // 볼륨 레벨 시뮬레이션 중지
    stopVoiceLevelSimulation();
    
    // MediaRecorder 중지
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        console.log('✅ MediaRecorder 중지 완료');
      } catch (error) {
        console.error('❌ MediaRecorder 중지 실패:', error);
      }
    }
    
    // 음성 인식 중지
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
        console.log('✅ 음성 인식 중지 완료');
      } catch (error) {
        console.error('❌ 음성 인식 중지 실패:', error);
      }
    }
    
    // 미디어 스트림 정리
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
      console.log('✅ 미디어 스트림 정리 완료');
    }
    
    // refs 정리
    mediaRecorderRef.current = null;
    
    console.log('🛑 MediaRecorder 음성 분석 완전 중지');
  };

  // 음성 분석 리포트 가져오기
  const fetchVoiceAnalysisReport = async () => {
    try {
      const response = await fetch(`${BASE_URL}/voice/analysis_report`);
      const data = await response.json();
      
      if (data.overall_score !== undefined) {
        setVoiceAnalysisReport(data);
        setShowVoiceReport(true);
        console.log('📊 음성 분석 리포트 수신:', data);
      }
    } catch (error) {
      console.error('음성 분석 리포트 가져오기 실패:', error);
    }
  };

  // TTS 음성 출력
  const speakQuestion = (text) => {
    if (!voiceEnabled || !text) return;
    if (lastQuestionRef.current === text) return;
    lastQuestionRef.current = text;

    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      const voices = speechSynthesis.getVoices();
      const koreanVoice = voices.find(voice => 
        voice.lang.startsWith('ko') || 
        voice.name.includes('Korean') ||
        voice.name.includes('Kyoko') ||
        voice.name.includes('Yuna')
      );
      
      if (koreanVoice) {
        utterance.voice = koreanVoice;
      } else if (voices.length > 0) {
        utterance.voice = voices[0];
      }

      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.9;
      utterance.lang = 'ko-KR';

      utterance.onstart = () => console.log('🔊 음성 출력 시작');
      utterance.onend = () => console.log('✅ 음성 출력 완료');
      utterance.onerror = (event) => console.error('❌ 음성 출력 오류:', event.error);

      speechSynthesis.speak(utterance);
    }
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      lastQuestionRef.current = '';
    }
  };

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    console.log('🚀 컴포넌트 초기화 시작');
    initSpeechSynthesis();
    initSpeechRecognition();
    
    return () => {
      console.log('🧹 컴포넌트 정리');
      stopSpeech();
      stopVoiceAnalysis();
      stopMicTest();
    };
  }, []);

  // 디바이스 감지
  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width <= 768;
      const isTablet = width > 768 && width <= 1024;
      const orientation = width > height ? 'landscape' : 'portrait';

      setDeviceInfo({ isMobile, isTablet, orientation, width, height });
    };

    updateDeviceInfo();
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', () => setTimeout(updateDeviceInfo, 100));

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  // 자세 피드백 음성
  const speakIssue = (text) => {
    if (!voiceEnabled || !text) return;
    
    const now = Date.now();
    if (lastIssueTimeRef.current[text]) {
      const timeSinceLastSpeak = now - lastIssueTimeRef.current[text];
      if (timeSinceLastSpeak < 5000) return;
    }
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.1;
      utterance.pitch = 1.2;
      utterance.volume = 0.7;
      
      speechSynthesis.speak(utterance);
      lastIssueTimeRef.current[text] = now;
    }
  };

  // 서버 연결 확인
  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch(`${BASE_URL}/health`);
        setIsServerConnected(response.ok);
      } catch (error) {
        setIsServerConnected(false);
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 10000);
    return () => clearInterval(interval);
  }, []);

  // 실시간 데이터 스트림
  useEffect(() => {
    if (isAnalyzing && isServerConnected) {
        eventSourceRef.current = new EventSource(`${BASE_URL}/stream_data`);
        
        let previousPhase = ''; // 추가
        
        eventSourceRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setRealtimeData(data);
            
            if (data.interview) {
              const prevQuestion = interviewData.current_question;
              const prevActive = interviewData.active;
              
              // phase 변경 감지 추가
              if (previousPhase === 'thinking' && data.interview.phase === 'answering') {
                console.log('🔔 답변 시작!');
                playBeep();
              }
              previousPhase = data.interview.phase;
              
              setInterviewData(data.interview);
            
            // 새로운 질문 음성 출력
            if (data.interview.current_question && 
                data.interview.current_question !== prevQuestion &&
                data.interview.phase === 'thinking') {
              setTimeout(() => speakQuestion(data.interview.current_question), 500);
            }
            
            // 면접이 방금 끝났을 때 음성 분석 리포트 확인
            if (prevActive && !data.interview.active && data.interview.phase === 'finished') {
              console.log('🎬 면접이 방금 완료되었습니다. 음성 분석 리포트 확인 중...');
              setTimeout(() => {
                const checkReportInterval = setInterval(async () => {
                  try {
                    const response = await fetch(`${BASE_URL}/voice/analysis_report`);
                    const reportData = await response.json();
                    
                    if (reportData.overall_score !== undefined) {
                      console.log('📊 음성 분석 리포트 수신 완료:', reportData);
                      setVoiceAnalysisReport(reportData);
                      setShowVoiceReport(true);
                      stopVoiceAnalysis();
                      clearInterval(checkReportInterval);
                    } else {
                      console.log('⏳ 음성 분석 리포트 대기 중...');
                    }
                  } catch (error) {
                    console.error('음성 분석 리포트 확인 실패:', error);
                  }
                }, 1000);
                
                setTimeout(() => {
                  clearInterval(checkReportInterval);
                  console.log('⏰ 음성 분석 리포트 대기 시간 초과');
                }, 10000);
                
              }, 2000);
            }
          }
          
          // 음성 분석 데이터 처리
          if (data.voice_analysis) {
            console.log('🎤 음성 분석 상태:', {
              active: data.voice_analysis.session_active,
              complete: data.voice_analysis.analysis_complete,
              hasData: data.voice_analysis.has_data,
              samples: data.voice_analysis.sample_count,
              fillers: data.voice_analysis.filler_count
            });
            
            if (data.voice_analysis.analysis_complete && 
                data.voice_analysis.final_report && 
                !voiceAnalysisReport) {
              console.log('📊 스트림에서 음성 분석 리포트 수신:', data.voice_analysis.final_report);
              setVoiceAnalysisReport(data.voice_analysis.final_report);
              setShowVoiceReport(true);
              stopVoiceAnalysis();
            }
          }
          
          // 자세 분석 데이터
          if (data.issues && data.issues.length > 0) {
            setCurrentIssues(data.issues);
            if (!data.interview?.active) {
              data.issues.forEach((issue, index) => {
                setTimeout(() => speakIssue(issue), index * 100);
              });
            }
          } else {
            setCurrentIssues([]);
          }
          
          if (data.score !== undefined) {
            setPostureScore(data.score);
          }
        } catch (error) {
          console.error('데이터 파싱 오류:', error);
        }
      };

      eventSourceRef.current.onerror = () => {
        eventSourceRef.current.close();
      };
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [isAnalyzing, isServerConnected, voiceEnabled, interviewData.current_question, interviewData.active, showVoiceReport]);

  // 면접 시작
  const startInterview = async () => {
    setVoiceAnalysisReport(null);
   setShowVoiceReport(false);
    try {
      console.log('🎬 면접 시작 요청...');
      
      const response = await fetch(`${BASE_URL}/interview/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ 면접 시작 응답:', data);
        
        setInterviewData({
          active: true,
          current_question: data.current_question,
          category: data.category,
          question_number: 1,
          total_questions: data.total_questions,
          phase: 'thinking',
          time_remaining: 10,
          current_stage: data.flow_stage
        });

        // 음성 분석 시작
        if (voiceAnalysisEnabled) {
          console.log('🎤 음성 분석 활성화 시도...');
          const voiceStarted = await startVoiceAnalysisSession();
          if (voiceStarted) {
            console.log('✅ 음성 분석 활성화 성공');
          } else {
            console.log('❌ 음성 분석 활성화 실패');
          }
        }

        // 첫 질문 음성 출력
        setTimeout(() => speakQuestion(data.current_question), 1000);
        
      }
    } catch (error) {
      console.error('면접 시작 실패:', error);
    }
  };

  // 면접 중지
  const stopInterview = async () => {
    try {
      console.log('🛑 면접 중지 요청...');
      await fetch(`${BASE_URL}/interview/stop`, { method: 'POST' });
      stopSpeech();
      stopVoiceAnalysis();
      
      setInterviewData({
        active: false,
        current_question: null,
        category: null,
        question_number: 0,
        total_questions: 0,
        phase: 'thinking',
        time_remaining: 0,
        current_stage: null
      });

      setTimeout(() => fetchVoiceAnalysisReport(), 2000);
      
    } catch (error) {
      console.error('면접 중지 실패:', error);
    }
  };

  // 분석 시작/중지
  const toggleAnalysis = async () => {
    if (!isServerConnected) {
      alert('서버에 연결되지 않았습니다.');
      return;
    }

    if (!isAnalyzing) {
        setVoiceAnalysisReport(null);
        setShowVoiceReport(false);
      try {
        await fetch(`${BASE_URL}/start_analysis`, { method: 'POST' });
        
        if (deviceInfo.isMobile || deviceInfo.isTablet) {
          setIsOverlayMode(true);
        }
      } catch (error) {
        console.error('분석 시작 실패:', error);
      }
      
      setCurrentIssues([]);
      setPostureScore(100);
      setVideoError(false);
      lastSpokenIssueRef.current = '';
      lastIssueTimeRef.current = {};
    } else {
      try {
        await fetch(`${BASE_URL}/stop_analysis`, { method: 'POST' });
        stopSpeech();
        stopVoiceAnalysis();
        setIsOverlayMode(false);
        
        if (interviewData.active) {
          await stopInterview();
        }
      } catch (error) {
        console.error('분석 중지 실패:', error);
      }
    }
    
    setIsAnalyzing(!isAnalyzing);
  };

  // 음성 분석 리포트 강제 확인 함수
  const forceCheckVoiceReport = async () => {
    try {
      console.log('🔍 음성 분석 리포트 강제 확인...');
      const response = await fetch(`${BASE_URL}/voice/analysis_report`);
      const data = await response.json();
      
      if (data.overall_score !== undefined) {
        console.log('✅ 음성 분석 리포트 발견:', data);
        setVoiceAnalysisReport(data);
        setShowVoiceReport(true);
      } else {
        console.log('❌ 음성 분석 리포트 아직 준비되지 않음:', data);
      }
    } catch (error) {
      console.error('음성 분석 리포트 강제 확인 실패:', error);
    }
  };

  // 유틸리티 함수들
  const getScoreClass = (score) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    return 'score-poor';
  };

  const getPhaseText = (phase) => {
    switch (phase) {
      case 'thinking': return '생각 시간';
      case 'answering': return '답변 시간';
      case 'finished': return '완료';
      default: return '대기';
    }
  };

  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'thinking': return 'phase-thinking';
      case 'answering': return 'phase-answering';
      case 'finished': return 'phase-finished';
      default: return 'phase-waiting';
    }
  };

  const getVoiceLevelColor = (level) => {
    if (level < 20) return '#999';
    if (level < 50) return '#ffeb3b';
    if (level < 80) return '#4caf50';
    return '#ff5722';
  };

  // 음성 분석 리포트 컴포넌트
// 음성 분석 리포트 컴포넌트 (약 1320번째 줄)
const VoiceAnalysisReport = () => {
    if (!voiceAnalysisReport || !showVoiceReport) return null;
  
    const hasAI = voiceAnalysisReport.ai_powered;
    const aiDetails = voiceAnalysisReport.ai_details;
    const details = voiceAnalysisReport.detailed_analysis;
  
    return (
      <div 
        className="voice-report-modal" 
        onClick={() => setShowVoiceReport(false)}
      >
        <div 
          className="voice-report-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="voice-report-header">
            <h2>🎤 음성 분석 결과 {hasAI && <span style={{fontSize: '14px', color: '#4CAF50'}}>🤖 AI 분석</span>}</h2>
            <button 
              className="voice-report-close"
              onClick={(e) => {
                e.stopPropagation();
                setShowVoiceReport(false);
              }}
            >
              ✕
            </button>
          </div>
          
          <div className="voice-report-body">
            <div className="voice-overall-score">
              <div className="score-circle">
                <span className="score-value">{voiceAnalysisReport.overall_score}</span>
                <span className="score-label">종합 점수</span>
              </div>
            </div>
            
            <div className="voice-details">
              <div className="voice-metric">
                <span className="metric-label">음성 자신감</span>
                <div className="metric-bar">
                  <div 
                    className="metric-fill" 
                    style={{ width: `${details.voice_confidence}%` }}
                  ></div>
                </div>
                <span className="metric-value">{details.voice_confidence}%</span>
              </div>
              
              <div className="voice-metric">
                <span className="metric-label">음량 일관성</span>
                <div className="metric-bar">
                  <div 
                    className="metric-fill" 
                    style={{ width: `${details.volume_consistency}%` }}
                  ></div>
                </div>
                <span className="metric-value">{details.volume_consistency}%</span>
              </div>
              
              <div className="voice-metric">
                <span className="metric-label">음성 안정성</span>
                <div className="metric-bar">
                  <div 
                    className="metric-fill" 
                    style={{ width: `${details.voice_stability}%` }}
                  ></div>
                </div>
                <span className="metric-value">{details.voice_stability}%</span>
              </div>
              
              {/* 🔧 AI 분석 추가 항목 */}
              {hasAI && details.jitter_percent !== undefined && (
                <div className="voice-metric">
                  <span className="metric-label">🤖 음정 떨림 (Jitter)</span>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill" 
                      style={{ 
                        width: `${Math.max(0, 100 - details.jitter_percent * 20)}%`,
                        backgroundColor: details.jitter_percent < 2 ? '#4CAF50' : details.jitter_percent < 3.5 ? '#FFC107' : '#F44336'
                      }}
                    ></div>
                  </div>
                  <span className="metric-value">{details.jitter_percent.toFixed(2)}%</span>
                </div>
              )}
              
              {hasAI && details.average_pitch !== undefined && (
                <div className="voice-metric">
                  <span className="metric-label">🤖 평균 음높이</span>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill" 
                      style={{ width: '70%', backgroundColor: '#2196F3' }}
                    ></div>
                  </div>
                  <span className="metric-value">{details.average_pitch.toFixed(0)} Hz</span>
                </div>
              )}
              
              {hasAI && details.vocabulary_richness !== undefined && (
                <div className="voice-metric">
                  <span className="metric-label">🤖 어휘 다양성</span>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill" 
                      style={{ width: `${details.vocabulary_richness}%` }}
                    ></div>
                  </div>
                  <span className="metric-value">{details.vocabulary_richness.toFixed(1)}%</span>
                </div>
              )}
              
              <div className="voice-stats">
                <div className="stat-item">
                  <span className="stat-label">말하기 시간</span>
                  <span className="stat-value">{details.total_speaking_time}초</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">추임새 사용</span>
                  <span className="stat-value">
                    {details.filler_word_count}회 ({details.filler_ratio}%)
                  </span>
                </div>
                {hasAI && details.connective_count !== undefined && (
                  <div className="stat-item">
                    <span className="stat-label">🤖 접속사 사용</span>
                    <span className="stat-value">{details.connective_count}회</span>
                  </div>
                )}
                {hasAI && details.avg_sentence_length !== undefined && (
                  <div className="stat-item">
                    <span className="stat-label">🤖 평균 문장 길이</span>
                    <span className="stat-value">{details.avg_sentence_length.toFixed(1)}단어</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* 🔧 AI 인식된 텍스트 표시 */}
            {hasAI && aiDetails && aiDetails.recognized_text && (
              <div className="voice-recognized-text" style={{
                background: '#f5f5f5',
                padding: '15px',
                borderRadius: '8px',
                margin: '15px 0',
                maxHeight: '150px',
                overflow: 'auto'
              }}>
                <h4 style={{margin: '0 0 10px 0', fontSize: '14px', color: '#666'}}>
                  🤖 Whisper 인식 텍스트:
                </h4>
                <p style={{margin: 0, fontSize: '13px', lineHeight: '1.6', color: '#333'}}>
                  {aiDetails.recognized_text}
                </p>
              </div>
            )}
            
            {/* 🔧 AI 상세 분석 (접속사, 추임새 종류) */}
            {hasAI && aiDetails && (
              <div className="ai-details" style={{
                background: '#e3f2fd',
                padding: '15px',
                borderRadius: '8px',
                margin: '15px 0'
              }}>
                <h4 style={{margin: '0 0 10px 0', fontSize: '14px', color: '#1976D2'}}>
                  🤖 AI 상세 분석
                </h4>
                
                {aiDetails.filler_words && Object.keys(aiDetails.filler_words).length > 0 && (
                  <div style={{marginBottom: '10px'}}>
                    <strong style={{fontSize: '13px'}}>추임새 분석:</strong>
                    <div style={{fontSize: '12px', marginTop: '5px'}}>
                      {Object.entries(aiDetails.filler_words).map(([word, count]) => (
                        <span key={word} style={{
                          display: 'inline-block',
                          background: '#fff',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          margin: '3px',
                          border: '1px solid #ddd'
                        }}>
                          "{word}" {count}회
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {aiDetails.connectives && Object.keys(aiDetails.connectives).length > 0 && (
                  <div style={{marginBottom: '10px'}}>
                    <strong style={{fontSize: '13px'}}>접속사 분석:</strong>
                    <div style={{fontSize: '12px', marginTop: '5px'}}>
                      {Object.entries(aiDetails.connectives).map(([word, count]) => (
                        <span key={word} style={{
                          display: 'inline-block',
                          background: '#fff',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          margin: '3px',
                          border: '1px solid #ddd'
                        }}>
                          "{word}" {count}회
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {aiDetails.top_nouns && Object.keys(aiDetails.top_nouns).length > 0 && (
                  <div>
                    <strong style={{fontSize: '13px'}}>자주 사용한 단어:</strong>
                    <div style={{fontSize: '12px', marginTop: '5px'}}>
                      {Object.entries(aiDetails.top_nouns).slice(0, 8).map(([word, count]) => (
                        <span key={word} style={{
                          display: 'inline-block',
                          background: '#fff',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          margin: '3px',
                          border: '1px solid #ddd'
                        }}>
                          "{word}" {count}회
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="voice-recommendations">
              <h3>📋 개선 제안</h3>
              <ul>
                {voiceAnalysisReport.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
            
            {/* 디버그 정보 */}
            {voiceAnalysisReport.debug_info && (
              <div style={{
                fontSize: '11px',
                color: '#999',
                marginTop: '15px',
                padding: '10px',
                background: '#fafafa',
                borderRadius: '4px'
              }}>
                <div>분석 샘플: {voiceAnalysisReport.debug_info.samples_analyzed}개</div>
                <div>청크 수신: {voiceAnalysisReport.debug_info.chunks_received}개</div>
                {hasAI && (
                  <>
                    <div>✅ Whisper: {voiceAnalysisReport.debug_info.has_whisper ? '활성' : '비활성'}</div>
                    <div>✅ librosa: {voiceAnalysisReport.debug_info.has_librosa ? '활성' : '비활성'}</div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 🔧 추가: 마이크 테스트 결과 표시 컴포넌트
  const MicTestResults = () => {
    if (!micTestResults || micTestResults.error) return null;

    return (
      <div style={{
        background: micTestResults.signalDetected 
          ? 'rgba(76, 175, 80, 0.1)' 
          : 'rgba(244, 67, 54, 0.1)',
        border: `2px solid ${micTestResults.signalDetected ? '#4CAF50' : '#F44336'}`,
        borderRadius: '8px',
        padding: '12px',
        margin: '10px 0',
        fontSize: '14px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
          🧪 마이크 테스트 결과:
        </div>
        <div>
          최대 볼륨: {micTestResults.maxVolume.toFixed(1)}% | 
          평균 볼륨: {micTestResults.avgVolume.toFixed(1)}% | 
          신호 감지: {micTestResults.signalDetected ? '✅' : '❌'}
        </div>
        {micTestResults.signalDetected && micTestResults.maxVolume > 20 && (
          <div style={{ color: '#4CAF50', fontWeight: 'bold' }}>
            ✅ 마이크가 정상적으로 작동합니다! 면접을 시작할 수 있습니다.
          </div>
        )}
      </div>
    );
  };

  // 오버레이 모드 (모바일/태블릿)
  if (isOverlayMode && (deviceInfo.isMobile || deviceInfo.isTablet)) {
    return (
      <div className={`overlay-container ${deviceInfo.orientation}`}>
        <div className="video-overlay">
          {isAnalyzing && isServerConnected ? (
            <>
              <img 
                ref={imgRef}
                src={`${BASE_URL}/video_feed`}
                alt="Video Feed"
                className={`overlay-video ${videoError ? 'hidden' : ''}`}
                onError={() => setVideoError(true)}
                onLoad={() => setVideoError(false)}
              />
              
              {videoError && (
                <div className="video-loading">
                  <Camera />
                  <p>비디오 로딩 중...</p>
                </div>
              )}
              
              {/* 면접 질문 오버레이 */}
              {interviewData.active && interviewData.current_question && (
  <div className={`interview-overlay-mobile ${deviceInfo.orientation}`}>
    <div className="interview-header-mobile">
      <span className="question-number-mobile">Q{interviewData.question_number}/{interviewData.total_questions}</span>
      <span className="category-badge-mobile">{interviewData.category}</span>
    </div>
    
    <div className={`phase-indicator-mobile ${getPhaseColor(interviewData.phase)}`}>
      {interviewData.phase === 'thinking' && <Brain />}
      {getPhaseText(interviewData.phase)}: {interviewData.time_remaining}초
    </div>
    
    {/* 질문 텍스트 - 스크롤 가능하게 */}
    <div className="interview-question-mobile">
      {interviewData.current_question}
    </div>
    
    {/* 음성 분석 - 간소화 */}
    {voiceAnalysisActive && interviewData.phase === 'answering' && (
      <div className="voice-analysis-mobile">
        <Mic />
        <div 
          className="voice-level-bar-mobile"
          style={{ 
            width: `${voiceLevel}%`,
            backgroundColor: getVoiceLevelColor(voiceLevel)
          }}
        ></div>
        <span style={{fontSize: '12px', minWidth: '40px'}}>{Math.round(voiceLevel)}%</span>
      </div>
    )}
    
    <button 
      className="stop-interview-btn-mobile"
      onClick={stopInterview}
    >
      면접 중지
    </button>
  </div>
)}
              
              {/* 자세 피드백 */}
              {!interviewData.active && currentIssues.length > 0 && (
                <div className={`issues-overlay-mobile ${deviceInfo.orientation}`}>
                  <AlertCircle className="icon-alert" />
                  <div className="issues-text">
                    {currentIssues.map((issue, idx) => (
                      <div key={idx}>{issue}</div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 점수 오버레이 */}
              <div className={`score-overlay-mobile ${getScoreClass(postureScore)} ${deviceInfo.orientation} ${interviewData.active ? 'with-interview' : ''}`}>
                {postureScore}
              </div>
              
              {/* 컨트롤 오버레이 */}
              <div className={`controls-overlay ${deviceInfo.orientation} ${interviewData.active ? 'with-interview' : ''}`}>
                <button 
                  className={`voice-btn-overlay ${voiceEnabled ? 'voice-on' : 'voice-off'}`}
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                >
                  {voiceEnabled ? <Volume2 /> : <VolumeX />}
                </button>
                
                <button 
                  className={`voice-analysis-btn-overlay ${voiceAnalysisEnabled ? 'analysis-on' : 'analysis-off'}`}
                  onClick={() => setVoiceAnalysisEnabled(!voiceAnalysisEnabled)}
                >
                  {voiceAnalysisEnabled ? <Mic /> : <MicOff />}
                </button>
                
                {!interviewData.active && (
                  <button 
                    className="interview-btn-overlay"
                    onClick={startInterview}
                  >
                    <MessageSquare />
                  </button>
                )}
                
                {showVoiceReport && (
                  <button 
                    className="voice-report-btn-overlay"
                    onClick={() => setShowVoiceReport(true)}
                  >
                    <BarChart />
                  </button>
                )}
                
                <button 
                  className="stop-btn-overlay"
                  onClick={toggleAnalysis}
                >
                  중지
                </button>
              </div>
            </>
          ) : (
            <div className="overlay-placeholder">
              <Camera />
              <p>분석 시작 중...</p>
            </div>
          )}
        </div>
        
        <VoiceAnalysisReport />
      </div>
    );
  }

  // 일반 모드 (데스크탑)
  return (
    <div className="app-container">
      <div className="header">
        <h1>체육대학 육상전공 면접 연습 (자세 + 음성 분석)</h1>
        <div className={`connection-status ${isServerConnected ? 'connected' : 'disconnected'}`}>
          {isServerConnected ? '연결됨' : '서버 연결 안됨'}
        </div>
      </div>

      {/* 🔧 추가: 마이크 테스트 섹션 */}
      {!isAnalyzing && (
        <div className="mic-test-section" style={{
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white',
          padding: '20px',
          borderRadius: '12px',
          margin: '20px 0',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 15px 0' }}>🧪 마이크 테스트</h3>
          <p style={{ margin: '0 0 15px 0', opacity: 0.9 }}>
            면접 시작 전에 마이크가 정상 작동하는지 확인하세요
          </p>
          
          <button
            onClick={micTestActive ? stopMicTest : runMicrophoneTest}
            disabled={isAnalyzing && !micTestActive}
            style={{
              background: micTestActive 
                ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)' 
                : 'linear-gradient(135deg, #00d2ff, #3a7bd5)',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              margin: '0 10px'
            }}
          >
            {micTestActive ? '🛑 테스트 중지' : '🧪 마이크 테스트 시작'}
          </button>
          
          {micTestActive && (
            <div style={{ marginTop: '15px' }}>
              <div style={{ fontSize: '14px', marginBottom: '10px' }}>
                🗣️ 지금 마이크에 말해보세요! (10초간 테스트)
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '20px',
                height: '8px',
                overflow: 'hidden',
                margin: '10px auto',
                width: '200px'
              }}>
                <div style={{
                  width: `${voiceLevel}%`,
                  height: '100%',
                  background: getVoiceLevelColor(voiceLevel),
                  transition: 'width 0.1s ease'
                }}></div>
              </div>
              <div style={{ fontSize: '12px' }}>
                볼륨: {Math.round(voiceLevel)}%
              </div>
            </div>
          )}
          
          <MicTestResults />
        </div>
      )}

      {/* 면접 질문 패널 */}
      {interviewData.active && interviewData.current_question && (
        <div className="interview-panel">
          <div className="interview-info">
            <div className="interview-meta">
              <span className="question-counter">질문 {interviewData.question_number}/{interviewData.total_questions}</span>
              <span className="category-badge">{interviewData.category}</span>
              <span className={`phase-indicator ${getPhaseColor(interviewData.phase)}`}>
                {interviewData.phase === 'thinking' && <Brain />}
                {getPhaseText(interviewData.phase)}: {interviewData.time_remaining}초
              </span>
            </div>
            
            <div className="current-question">
              {interviewData.current_question}
            </div>
            
            {/* 음성 분석 상태 표시 */}
            {voiceAnalysisActive && (
              <div className="voice-analysis-panel">
                <div className="voice-indicator">
                  <Mic />
                  <span>음성 분석 중 (MediaRecorder)</span>
                  <div className="voice-level-bar">
                    <div 
                      className="voice-level-fill"
                      style={{ 
                        width: `${voiceLevel}%`,
                        backgroundColor: getVoiceLevelColor(voiceLevel)
                      }}
                    ></div>
                  </div>
                  <span className="voice-level-text">{Math.round(voiceLevel)}%</span>
                </div>
              </div>
            )}
            
            <div className="interview-controls">
              <button 
                className="btn-stop-interview"
                onClick={stopInterview}
              >
                면접 중지
              </button>
              
              {/* 음성 분석 상태 표시 */}
              {voiceAnalysisEnabled && (
                <div className="voice-analysis-status">
                  <span className={`voice-status-indicator ${voiceAnalysisActive ? 'active' : 'inactive'}`}>
                    <Mic />
                    {voiceAnalysisActive ? 'MediaRecorder 활성' : 'MediaRecorder 대기'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="video-container">
        {isAnalyzing && isServerConnected ? (
          <>
            <img 
              ref={imgRef}
              src={`${BASE_URL}/video_feed`}
              alt="Video Feed"
              className={`video-feed ${videoError ? 'hidden' : ''}`}
              onError={() => setVideoError(true)}
              onLoad={() => setVideoError(false)}
            />
            
            {videoError && (
              <div className="video-loading">
                <Camera />
                <p>비디오 로딩 중...</p>
              </div>
            )}
            
            {/* 면접 중이 아닐 때만 자세 피드백 표시 */}
            {!interviewData.active && currentIssues.length > 0 && (
              <div className="issues-overlay">
                <AlertCircle className="icon-alert" />
                <div className="issues-text">
                  {currentIssues.map((issue, idx) => (
                    <div key={idx}>{issue}</div>
                  ))}
                </div>
              </div>
            )}
            
            <div className={`score-overlay ${getScoreClass(postureScore)}`}>
              {postureScore}
            </div>
          </>
        ) : (
          <div className="video-placeholder">
            <Camera />
            <p>분석을 시작하려면 아래 버튼을 클릭하세요</p>
            {!isServerConnected && (
              <p className="error-message">서버가 실행되지 않았습니다</p>
            )}
          </div>
        )}
      </div>

      <div className="controls">
        <button
          onClick={toggleAnalysis}
          disabled={!isServerConnected}
          className={`btn-main ${!isServerConnected ? 'disabled' : isAnalyzing ? 'stop' : 'start'}`}
        >
          {isAnalyzing ? '분석 중지' : '분석 시작'}
        </button>
        
        {isAnalyzing && !interviewData.active && (
          <button
            onClick={startInterview}
            className="btn-interview"
          >
            <MessageSquare />
            면접 시작
          </button>
        )}
        
        <button
          onClick={() => {
            setVoiceEnabled(!voiceEnabled);
            if (!voiceEnabled && interviewData.current_question && interviewData.phase === 'thinking') {
              setTimeout(() => speakQuestion(interviewData.current_question), 500);
            } else {
              stopSpeech();
            }
          }}
          className={`btn-voice ${voiceEnabled ? 'voice-on' : 'voice-off'}`}
        >
          {voiceEnabled ? <Volume2 /> : <VolumeX />}
          {voiceEnabled ? ' 음성 ON' : ' 음성 OFF'}
        </button>
        
        <button
          onClick={() => setVoiceAnalysisEnabled(!voiceAnalysisEnabled)}
          className={`btn-voice-analysis ${voiceAnalysisEnabled ? 'analysis-on' : 'analysis-off'}`}
        >
          {voiceAnalysisEnabled ? <Mic /> : <MicOff />}
          {voiceAnalysisEnabled ? ' MediaRecorder ON' : ' MediaRecorder OFF'}
        </button>
        
        {voiceAnalysisReport && (
          <button
            onClick={() => setShowVoiceReport(true)}
            className="btn-voice-report"
          >
            <BarChart />
            음성 분석 결과
          </button>
        )}
        
        {/* 🔧 디버그 버튼 */}
        {!interviewData.active && (
          <button
            onClick={forceCheckVoiceReport}
            className="btn-debug"
            style={{
              background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            🔍 리포트 확인
          </button>
        )}
      </div>

      {/* 면접 안내 */}
      {isAnalyzing && !interviewData.active && (
        <div className="interview-guide">
          <h3>🎯 면접 연습 가이드 (자세 + MediaRecorder 음성 분석)</h3>
          <div className="guide-content">
            <div className="guide-item">
              <span className="guide-icon">💭</span>
              <span>질문 후 <strong>10초 생각 시간</strong>이 주어집니다</span>
            </div>
            <div className="guide-item">
              <span className="guide-icon">🗣️</span>
              <span><strong>50초 답변 시간</strong> 동안 자유롭게 답변하세요</span>
            </div>
            <div className="guide-item">
              <span className="guide-icon">🎤</span>
              <span><strong>MediaRecorder API</strong>로 음성을 안정적으로 수집합니다</span>
            </div>
            <div className="guide-item">
              <span className="guide-icon">📊</span>
              <span>면접 완료 후 <strong>종합 음성 분석 리포트</strong>를 제공합니다</span>
            </div>
            <div className="guide-item">
              <span className="guide-icon">🔄</span>
              <span>시간이 지나면 <strong>자동으로 다음 질문</strong>으로 넘어갑니다</span>
            </div>
            <div className="guide-item">
              <span className="guide-icon">📋</span>
              <span>총 <strong>6개의 체계적 질문</strong>이 출제됩니다</span>
            </div>
            <div className="guide-item">
              <span className="guide-icon">🌐</span>
              <span><strong>HTTP 환경</strong>에서도 안정적으로 작동합니다</span>
            </div>
            <div className="guide-item">
              <span className="guide-icon">🎯</span>
              <span className={`voice-analysis-guide ${voiceAnalysisActive ? 'active' : 'inactive'}`}>
                MediaRecorder: {voiceAnalysisActive ? '✅ 활성화됨' : '⏸️ 대기 중'}
              </span>
            </div>
          </div>
        </div>
      )}
      
      <VoiceAnalysisReport />
    </div>
  );
}
