// App.jsx - WebRTC 기반 자세 분석 + 음성 분석 통합 시스템 (개선)
import React, { useState, useEffect, useRef } from 'react';
import '../src/interview.css'

const BASE_URL = 'http://192.168.35.218:5001';

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
  const [currentIssues, setCurrentIssues] = useState([]);
  const [postureScore, setPostureScore] = useState(100);
  const [cameraLoading, setCameraLoading] = useState(false);
  
  // 음성 관련 상태
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceAnalysisEnabled, setVoiceAnalysisEnabled] = useState(true);
  const [voiceAnalysisActive, setVoiceAnalysisActive] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [voiceAnalysisReport, setVoiceAnalysisReport] = useState(null);
  const [showVoiceReport, setShowVoiceReport] = useState(false);
  
  // 마이크 테스트 상태
  const [micTestActive, setMicTestActive] = useState(false);
  const [micTestResults, setMicTestResults] = useState(null);
  
  // 리포트 표시 플래그
  const reportShownRef = useRef(false);
  const lastReportTimestampRef = useRef(0);
  const checkIntervalRef = useRef(null); // interval ID 저장
  
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
  
  // WebRTC 관련 refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const calibrationTimeoutRef = useRef(null);
  const prevPhaseRef = useRef('');
  const prevActiveRef = useRef(false);
  
  // MediaRecorder 관련 refs
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const chunkCountRef = useRef(0);
  const voiceLevelIntervalRef = useRef(null);
  
  // 마이크 테스트 refs
  const micTestIntervalRef = useRef(null);
  const micTestAudioContextRef = useRef(null);
  
  const lastQuestionRef = useRef('');
  const lastIssueTimeRef = useRef({});


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
    console.warn('Web Speech API를 지원하지 않는 브라우저입니다.');
    return false;
  };

  // 음성 인식 초기화
  const initSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech Recognition API를 지원하지 않는 브라우저입니다.');
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ko-KR';
    
    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          sendSpeechTextToServer(transcript.trim());
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

  // 서버로 음성 텍스트 전송
  const sendSpeechTextToServer = async (text) => {
    if (!voiceAnalysisActive || !interviewData.active || !text.trim()) return;
    
    try {
      console.log('음성 텍스트 전송:', text);
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

  // 자세 피드백 음성 출력
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

  // WebRTC: 카메라 시작
  const startCamera = async () => {
    try {
      console.log('카메라 시작 중...');
      setCameraLoading(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });
      
      console.log('미디어 스트림 획득 성공');
      streamRef.current = stream;
      
      await new Promise((resolve) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          videoRef.current.onloadedmetadata = () => {
            console.log('비디오 메타데이터 로드 완료');
            setCameraLoading(false);
            resolve();
          };
          
          videoRef.current.play()
            .then(() => console.log('비디오 재생 시작'))
            .catch(err => console.error('재생 실패:', err));
        } else {
          setCameraLoading(false);
          resolve();
        }
      });
      
      console.log('카메라 완전 초기화 완료');
      return true;
      
    } catch (error) {
      console.error('카메라 시작 실패:', error);
      setCameraLoading(false);
      
      let errorMessage = '카메라 접근 실패:\n\n';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += '카메라 권한이 거부되었습니다.\n\n해결방법:\n1. 브라우저 주소창 왼쪽 아이콘 클릭\n2. 카메라 권한을 "허용"으로 변경\n3. 페이지 새로고침';
      } else if (error.name === 'NotFoundError') {
        errorMessage += '카메라를 찾을 수 없습니다.\n\n확인사항:\n- 카메라가 연결되어 있는지\n- 다른 앱에서 카메라 사용 중인지';
      } else if (error.name === 'NotReadableError') {
        errorMessage += '카메라를 사용할 수 없습니다.\n\n다른 프로그램에서 카메라를 사용 중일 수 있습니다.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
      return false;
    }
  };

  // WebRTC: 프레임 전송
  const startSendingFrames = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) {
      console.error('캔버스 또는 비디오 요소 없음');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    
    const waitForVideo = setInterval(() => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        clearInterval(waitForVideo);
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        console.log('프레임 전송 시작:', canvas.width, 'x', canvas.height);
        
        let frameCount = 0;
        let lastSendTime = 0;
        
        frameIntervalRef.current = setInterval(async () => {
          if (!video.videoWidth) return;
          
          // 좌우반전 + 비디오 그리기
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
          ctx.restore();
          
          // 가이드 프레임 그리기
          const guideFrame = {
            x_min: 0.25, x_max: 0.75,
            y_min: 0.15, y_max: 0.85
          };
          
          const x1 = canvas.width * guideFrame.x_min;
          const y1 = canvas.height * guideFrame.y_min;
          const x2 = canvas.width * guideFrame.x_max;
          const y2 = canvas.height * guideFrame.y_max;
          
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.fillRect(0, 0, canvas.width, y1);
          ctx.fillRect(0, y2, canvas.width, canvas.height - y2);
          ctx.fillRect(0, y1, x1, y2 - y1);
          ctx.fillRect(x2, y1, canvas.width - x2, y2 - y1);
          
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 3;
          ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
          
          frameCount++;
          
          const now = Date.now();
          if (now - lastSendTime < 333) return;
          lastSendTime = now;
          
          const frameData = canvas.toDataURL('image/jpeg', 0.5);
          
          try {
            const response = await fetch(`${BASE_URL}/analyze_frame`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ frame: frameData })
            });
            
            if (response.ok) {
              const data = await response.json();
              
              if (data.posture_score !== undefined) {
                setPostureScore(data.posture_score);
              }
              
              if (data.issues && data.issues.length > 0) {
                setCurrentIssues(data.issues);
                
                if (!interviewData.active) {
                  data.issues.forEach((issue, index) => {
                    setTimeout(() => speakIssue(issue), index * 100);
                  });
                }
              } else if (data.issues) {
                setCurrentIssues([]);
              }
              
              if (data.interview) {
                updateInterviewData(data.interview);
              }
            }
          } catch (error) {
            if (frameCount % 50 === 0) {
              console.error('프레임 전송 실패:', error);
            }
          }
        }, 100);
      }
    }, 100);
  };

  const stopSendingFrames = () => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
      console.log('프레임 전송 중지');
    }
  };

  // 면접 데이터 업데이트
  const updateInterviewData = (newData) => {
    const prevQuestion = interviewData.current_question;
    
    setInterviewData(newData);
    
    // 새 질문 음성 출력
    if (newData.current_question && 
        newData.current_question !== prevQuestion &&
        newData.phase === 'thinking') {
      setTimeout(() => speakQuestion(newData.current_question), 500);
    }
    
    // 답변 시작 신호음 (한 번만)
    if (prevPhaseRef.current === 'thinking' && newData.phase === 'answering') {
      console.log('🔔 답변 시작 신호음');
      playBeep();
    }
    
    // 면접 종료 감지
    const isEnding = prevActiveRef.current && !newData.active && newData.phase === 'finished';
    
    if (isEnding) {
      console.log('========== 면접 종료 감지 ==========');
      
      // ===== 중복 방지: 이미 확인 중이면 스킵 =====
      if (checkIntervalRef.current) {
        console.log('⚠️ 이미 리포트 확인 중 - 중복 실행 방지');
        prevPhaseRef.current = newData.phase;
        prevActiveRef.current = newData.active;
        return;
      }
      
      // 음성 분석 중지
      stopVoiceAnalysis();
      
      // 리포트 확인 시작
      setTimeout(() => {
        checkVoiceReportPeriodically();
      }, 2000);
    }
    
    // 이전 상태 저장
    prevPhaseRef.current = newData.phase;
    prevActiveRef.current = newData.active;
  };
  
  const checkVoiceReportPeriodically = () => {
    // 1. 기존 interval 정리
    if (checkIntervalRef.current) {
      console.log('⚠️ 기존 리포트 확인 interval 정리');
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
    
    let attempts = 0;
    const maxAttempts = 30;
    
    console.log('📊 주기적 리포트 확인 시작 (최대 30초)');
    
    const checkInterval = setInterval(async () => {
      attempts++;
      console.log(`📊 리포트 확인 중... (${attempts}/${maxAttempts})`);
      
      try {
        const response = await fetch(`${BASE_URL}/voice/analysis_report`);
        
        if (!response.ok) {
          if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            checkIntervalRef.current = null;
            alert('음성 분석이 완료되지 않았습니다.\n"음성 분석 결과" 버튼을 눌러 나중에 확인하세요.');
          }
          return;
        }
        
        const data = await response.json();
        
        // 2. 리포트 발견 시
        if (data.overall_score !== undefined && 
            data.overall_score > 0 && 
            data.analysis_timestamp) {
          
          // 3. 중복 방지: 타임스탬프 체크
          if (lastReportTimestampRef.current === data.analysis_timestamp) {
            console.log('⚠️ 이미 표시한 리포트 (타임스탬프 일치) - interval 종료');
            clearInterval(checkInterval);
            checkIntervalRef.current = null;
            return;
          }
          
          // 4. 중복 방지: 이미 표시했는지 체크
          if (reportShownRef.current) {
            console.log('⚠️ 이미 리포트 표시됨 - interval 종료');
            clearInterval(checkInterval);
            checkIntervalRef.current = null;
            return;
          }
          
          console.log('✅ 새로운 음성 분석 리포트 수신:', data);
          
          // 타임스탬프 저장
          lastReportTimestampRef.current = data.analysis_timestamp;
          reportShownRef.current = true;
          
          // 리포트 표시
          setVoiceAnalysisReport(data);
          setShowVoiceReport(true);
          
          // interval 정리
          clearInterval(checkInterval);
          checkIntervalRef.current = null;
          
          // 한 번만 알림
          alert(`음성 분석 완료!\n\n종합 점수: ${data.overall_score}점`);
          
        } else if (attempts >= maxAttempts) {
          console.log('⏰ 리포트 대기 시간 초과');
          clearInterval(checkInterval);
          checkIntervalRef.current = null;
          alert('음성 분석이 완료되지 않았습니다.');
        }
      } catch (error) {
        console.error('리포트 확인 오류:', error);
        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          checkIntervalRef.current = null;
        }
      }
    }, 1000);
    
    // interval ID 저장
    checkIntervalRef.current = checkInterval;
  };

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
    } catch (error) {
      console.error('신호음 재생 실패:', error);
    }
  };

  const speakQuestion = (text) => {
    if (!voiceEnabled || !text) return;
    if (lastQuestionRef.current === text) return;
    lastQuestionRef.current = text;

    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const voices = speechSynthesis.getVoices();
      const koreanVoice = voices.find(voice => voice.lang.startsWith('ko'));
      
      if (koreanVoice) utterance.voice = koreanVoice;
      utterance.rate = 0.9;
      utterance.lang = 'ko-KR';

      speechSynthesis.speak(utterance);
    }
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      lastQuestionRef.current = '';
    }
  };

  // 마이크 테스트
  const runMicrophoneTest = async () => {
    try {
      console.log('종합 마이크 테스트 시작...');
      setMicTestActive(true);
      setMicTestResults(null);
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      
      if (audioDevices.length === 0) {
        throw new Error('마이크 디바이스를 찾을 수 없습니다.');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      analyser.fftSize = 2048;
      source.connect(analyser);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      let testCount = 0;
      let maxVolume = 0;
      let volumeSum = 0;
      let signalCount = 0;
      const maxCount = 100;
      
      micTestIntervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const average = sum / bufferLength;
        const volume = (average / 128) * 100;
        
        if (average > 5) signalCount++;
        
        maxVolume = Math.max(maxVolume, volume);
        volumeSum += volume;
        setVoiceLevel(volume);
        
        testCount++;
        
        if (testCount >= maxCount) {
          clearInterval(micTestIntervalRef.current);
          
          const results = {
            maxVolume,
            avgVolume: volumeSum / testCount,
            signalDetected: signalCount > 0,
            signalRatio: (signalCount / testCount) * 100
          };
          
          stream.getTracks().forEach(track => track.stop());
          audioContext.close();
          
          setMicTestActive(false);
          setMicTestResults(results);
          setVoiceLevel(0);
          
          alert(`마이크 테스트 완료!\n\n최대 볼륨: ${results.maxVolume.toFixed(1)}%\n평균 볼륨: ${results.avgVolume.toFixed(1)}%\n신호 감지: ${results.signalDetected ? '확인' : '감지 안됨'}`);
        }
      }, 100);
      
    } catch (error) {
      console.error('마이크 테스트 실패:', error);
      setMicTestActive(false);
      alert('마이크 테스트 실패: ' + error.message);
    }
  };

  const stopMicTest = () => {
    if (micTestIntervalRef.current) {
      clearInterval(micTestIntervalRef.current);
    }
    setMicTestActive(false);
    setVoiceLevel(0);
  };

  // MediaRecorder 초기화
  const initMediaRecorderAnalysis = async () => {
    try {
      console.log('MediaRecorder 초기화 시작');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        } 
      });
      
      console.log('마이크 스트림 획득 성공');
      
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        console.log('오디오 트랙 상태:', {
          enabled: audioTrack.enabled,
          muted: audioTrack.muted,
          readyState: audioTrack.readyState,
          label: audioTrack.label
        });
        
        audioTrack.onended = () => console.log('오디오 트랙 종료됨');
        audioTrack.onmute = () => console.log('오디오 트랙 음소거됨');
        audioTrack.onunmute = () => console.log('오디오 트랙 음소거 해제됨');
      }
      
      mediaStreamRef.current = stream;
      
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
      
      console.log('사용할 오디오 형식:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000
      });
      
      let audioChunks = [];
      chunkCountRef.current = 0;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunkCountRef.current++;
          console.log(`오디오 청크 수신 #${chunkCountRef.current} - 크기: ${event.data.size} bytes`);
          
          audioChunks.push(event.data);
          
          // 즉시 서버 전송 (await 없이 실행)
          sendAudioChunkToServer(event.data, chunkCountRef.current)
            .then(() => {
              console.log(`✅ 청크 #${chunkCountRef.current} 서버 전송 성공`);
            })
            .catch(err => {
              console.error(`❌ 청크 #${chunkCountRef.current} 전송 실패:`, err);
            });
        } else {
          console.warn(`빈 청크 감지 #${chunkCountRef.current}`);
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log(`MediaRecorder 중지 - 총 ${chunkCountRef.current}개 청크 수집`);
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        console.log('최종 오디오 파일 크기:', audioBlob.size, 'bytes');
        
        if (audioBlob.size > 0) {
          console.log('📤 최종 오디오 파일 서버 전송 시작...');
          sendFinalAudioToServer(audioBlob)
            .then(() => {
              console.log('✅ 최종 오디오 파일 전송 완료');
            })
            .catch(err => {
              console.error('❌ 최종 오디오 파일 전송 실패:', err);
            });
        } else {
          console.error('최종 오디오가 비어있습니다!');
        }
        
        audioChunks = [];
        chunkCountRef.current = 0;
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder 오류:', event.error);
      };
      
      mediaRecorder.onstart = () => {
        console.log('MediaRecorder 녹음 시작됨');
      };
      
      mediaRecorderRef.current = mediaRecorder;
      
      console.log('MediaRecorder 초기화 완료!');
      return true;
      
    } catch (error) {
      console.error('MediaRecorder 초기화 실패:', error);
      
      let errorMessage = '';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = '마이크 권한이 거부되었습니다.\n\n해결 방법:\n1. 브라우저 주소창 왼쪽 아이콘 클릭\n2. 마이크 권한을 "허용"으로 변경\n3. 페이지 새로고침';
      } else if (error.name === 'NotFoundError') {
        errorMessage = '마이크를 찾을 수 없습니다. 마이크 연결을 확인해주세요.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'MediaRecorder를 지원하지 않는 브라우저입니다. Chrome, Firefox, Safari를 사용해주세요.';
      } else {
        errorMessage = `마이크 오류: ${error.message}`;
      }
      
      alert(errorMessage);
      return false;
    }
  };

  // 실시간 오디오 분석기
  const initRealTimeAudioAnalyzer = async () => {
    if (!mediaStreamRef.current) {
      console.error('미디어 스트림이 없습니다.');
      return false;
    }
    
    try {
      console.log('실시간 오디오 분석기 초기화 시작...');
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('AudioContext 생성:', audioContext.state);
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('AudioContext resume 완료:', audioContext.state);
      }
      
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(mediaStreamRef.current);
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      console.log('오디오 분석기 설정 완료 - 버퍼 크기:', bufferLength);
      
      let frameCount = 0;
      
      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const average = sum / bufferLength;
        const volume = Math.min(100, (average / 128) * 100);
        
        setVoiceLevel(volume);
        
        frameCount++;
        
        if (frameCount % 100 === 0) {
          console.log(`실시간 볼륨: ${volume.toFixed(1)}% (평균: ${average.toFixed(1)})`);
        }
        
        requestAnimationFrame(updateVolume);
      };
      
      updateVolume();
      console.log('실시간 볼륨 모니터링 시작!');
      
      voiceLevelIntervalRef.current = audioContext;
      
      return true;
      
    } catch (error) {
      console.error('실시간 오디오 분석기 초기화 실패:', error);
      return false;
    }
  };

  const stopVoiceLevelSimulation = () => {
    if (voiceLevelIntervalRef.current) {
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
      console.log(`📤 청크 #${chunkNumber} 서버 전송 시작... (${audioBlob.size} bytes)`);
      
      const formData = new FormData();
      formData.append('audio', audioBlob, `chunk_${chunkNumber}.webm`);
      formData.append('chunk_number', chunkNumber);
      formData.append('timestamp', Date.now());
      formData.append('question_number', interviewData.question_number || 0);
      formData.append('phase', interviewData.phase || 'unknown');
      
      console.log(`📡 청크 #${chunkNumber} 요청 URL: ${BASE_URL}/voice/audio_chunk_blob`);
      
      const response = await fetch(`${BASE_URL}/voice/audio_chunk_blob`, {
        method: 'POST',
        body: formData
      });
      
      console.log(`📥 청크 #${chunkNumber} 서버 응답 상태: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ 청크 #${chunkNumber} 전송 성공:`, result);
      } else {
        const errorText = await response.text();
        console.error(`❌ 청크 #${chunkNumber} 서버 에러 (${response.status}):`, errorText);
      }
    } catch (error) {
      console.error(`❌ 청크 #${chunkNumber} 네트워크 오류:`, error);
      console.error('에러 상세:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
  };

  const sendFinalAudioToServer = async (audioBlob) => {
    try {
      console.log(`📤 최종 오디오 파일 서버 전송 시작... (${audioBlob.size} bytes)`);
      
      const formData = new FormData();
      formData.append('final_audio', audioBlob, 'final_audio.webm');
      formData.append('timestamp', Date.now());
      
      console.log(`📡 최종 오디오 요청 URL: ${BASE_URL}/voice/final_audio`);
      
      const response = await fetch(`${BASE_URL}/voice/final_audio`, {
        method: 'POST',
        body: formData
      });
      
      console.log(`📥 최종 오디오 서버 응답 상태: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ 최종 오디오 파일 전송 성공:', result);
      } else {
        const errorText = await response.text();
        console.error(`❌ 최종 오디오 서버 에러 (${response.status}):`, errorText);
      }
    } catch (error) {
      console.error('❌ 최종 오디오 네트워크 오류:', error);
      console.error('에러 상세:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
  };

  const startVoiceAnalysisSession = async () => {
    if (!voiceAnalysisEnabled) {
      console.log('음성 분석이 비활성화되어 있습니다.');
      return false;
    }
    
    console.log('MediaRecorder 음성 분석 세션 시작...');
    setVoiceAnalysisActive(true);
    
    const success = await initMediaRecorderAnalysis();
    
    if (success && mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.start(100);
        console.log('MediaRecorder 녹음 시작 (100ms 청크)');
        
        await initRealTimeAudioAnalyzer();
        
        if (speechRecognitionRef.current) {
          speechRecognitionRef.current.start();
          console.log('음성 인식 시작');
        }
        
        return true;
      } catch (error) {
        console.error('MediaRecorder 시작 실패:', error);
        setVoiceAnalysisActive(false);
        return false;
      }
    } else {
      console.error('MediaRecorder 초기화 실패');
      setVoiceAnalysisActive(false);
      return false;
    }
  };

  const stopVoiceAnalysis = () => {
    console.log('MediaRecorder 음성 분석 중지 시작...');
    setVoiceAnalysisActive(false);
    
    stopVoiceLevelSimulation();
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        console.log('MediaRecorder 중지 완료');
      } catch (error) {
        console.error('MediaRecorder 중지 실패:', error);
      }
    }
    
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
        console.log('음성 인식 중지 완료');
      } catch (error) {
        console.error('음성 인식 중지 실패:', error);
      }
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
      console.log('미디어 스트림 정리 완료');
    }
    
    mediaRecorderRef.current = null;
    
    console.log('MediaRecorder 음성 분석 완전 중지');
  };

  const startAnalysis = async () => {
    if (!isServerConnected) {
      alert('서버에 연결되지 않았습니다.\n\n서버 주소: ' + BASE_URL);
      return;
    }
    
    // ========== 완전 초기화 ==========
    console.log('========== 완전 초기화 ==========');
    
    // 1. interval 정리
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
      console.log('✅ interval 정리');
    }
    
    // 2. 리포트 초기화
    setVoiceAnalysisReport(null);
    setShowVoiceReport(false);
    console.log('✅ 리포트 상태 초기화');
    
    // 3. 플래그 리셋
    reportShownRef.current = false;
    lastReportTimestampRef.current = 0;
    console.log('✅ 플래그 리셋');
    
    // 4. 면접 데이터 초기화
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
    console.log('✅ 면접 데이터 초기화');
    
    console.log('========== 🎯 자세 분석 시작 ==========');
    
    // 1. 카메라 시작
    console.log('1️⃣ 카메라 시작 시도...');
    const cameraStarted = await startCamera();
    if (!cameraStarted) {
      console.error('❌ 카메라 시작 실패로 분석 중단');
      return;
    }
    console.log('✅ 1/3: 카메라 시작 완료');
    
    // 2. 서버에 분석 시작 요청
    try {
      console.log('2️⃣ 서버에 분석 시작 요청...');
      const response = await fetch(`${BASE_URL}/start_analysis`, { method: 'POST' });
      
      if (!response.ok) {
        throw new Error('서버 응답 실패: ' + response.status);
      }
      
      const data = await response.json();
      console.log('✅ 2/3: 서버 분석 시작:', data);
      
      // 즉시 프레임 전송 시작
      console.log('========== 📸 프레임 전송 시작 ==========');
      startSendingFrames();
      
      alert('5초간 바른 자세를 유지하세요!\n캘리브레이션이 진행됩니다.');
      
      // 3. 5초 후 캘리브레이션 완료
      calibrationTimeoutRef.current = setTimeout(async () => {
        try {
          console.log('3️⃣ 캘리브레이션 완료 요청...');
          const calibResponse = await fetch(`${BASE_URL}/finalize_calibration`, { method: 'POST' });
          
          if (calibResponse.ok) {
            const calibData = await calibResponse.json();
            console.log('✅ 3/3: 캘리브레이션 완료:', calibData);
            console.log('========== 🎉 자세 분석 활성화 완료 ==========');
            
            setIsAnalyzing(true);
          } else {
            const errorData = await calibResponse.json();
            console.error('❌ 캘리브레이션 실패:', errorData);
            alert(`캘리브레이션 실패: ${errorData.message || '샘플 부족'}`);
            
            stopSendingFrames();
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
            }
          }
        } catch (error) {
          console.error('❌ 캘리브레이션 요청 실패:', error);
          alert('캘리브레이션 오류: ' + error.message);
          
          stopSendingFrames();
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }
        }
      }, 5000);
      
    } catch (error) {
      console.error('❌ 분석 시작 실패:', error);
      alert('분석 시작 실패:\n' + error.message);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const stopAnalysis = async () => {
    try {
      console.log('========== 분석 중지 ==========');
      
      // 1. interval 정리
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
        console.log('✅ interval 정리');
      }
      
      // 2. 리포트 닫기 (데이터는 유지)
      setShowVoiceReport(false);
      
      // 3. 서버 중지 요청
      await fetch(`${BASE_URL}/stop_analysis`, { method: 'POST' });
      
      if (calibrationTimeoutRef.current) {
        clearTimeout(calibrationTimeoutRef.current);
      }
      
      stopSendingFrames();
      stopSpeech();
      stopVoiceAnalysis();
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      setIsAnalyzing(false);
      
      if (interviewData.active) {
        await stopInterview();
      }
      
      console.log('✅ 분석 완전 중지');
    } catch (error) {
      console.error('분석 중지 실패:', error);
    }
  };

const startInterview = async () => {
  try {
    // ========== 완전 초기화 ==========
    console.log('========== 면접 시작 - 완전 초기화 ==========');
    
    // 1. interval 정리
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
    
    // 2. 리포트 초기화
    setVoiceAnalysisReport(null);
    setShowVoiceReport(false);
    
    // 3. 플래그 리셋
    reportShownRef.current = false;
    lastReportTimestampRef.current = 0;
    
    console.log('✅ 초기화 완료');
    
    console.log('========== 🎬 면접 시작 ==========');
    
    const response = await fetch(`${BASE_URL}/interview/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
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
          console.error('❌ 음성 분석 활성화 실패');
          alert('음성 분석을 시작할 수 없습니다.\n마이크 권한을 확인해주세요.');
        }
      }

      setTimeout(() => speakQuestion(data.current_question), 1000);
      
      console.log('========== 🎉 면접 준비 완료 ==========');
    }
  } catch (error) {
    console.error('❌ 면접 시작 실패:', error);
    alert('면접 시작 실패: ' + error.message);
  }
};

  const stopInterview = async () => {
    try {
      await fetch(`${BASE_URL}/interview/stop`, { method: 'POST' });
      stopSpeech();
      stopVoiceAnalysis();
      
      setInterviewData({
        active: false,
        current_question: null,
        phase: 'thinking'
      });

      setTimeout(fetchVoiceAnalysisReport, 2000);
    } catch (error) {
      console.error('면접 중지 실패:', error);
    }
  };

  const fetchVoiceAnalysisReport = async () => {
    // 이미 리포트가 표시되었다면 중복 실행 방지
    if (reportShownRef.current) {
      return;
    }
    
    try {
      const response = await fetch(`${BASE_URL}/voice/analysis_report`);
      
      if (!response.ok) {
        return;
      }
      
      const data = await response.json();
      
      if (data.overall_score !== undefined && 
          data.overall_score > 0 && 
          data.analysis_timestamp) {
        
        // 이미 처리한 타임스탬프인지 확인
        if (lastReportTimestampRef.current === data.analysis_timestamp) {
          return;
        }
        
        reportShownRef.current = true;
        lastReportTimestampRef.current = data.analysis_timestamp;
        
        setVoiceAnalysisReport(data);
        setShowVoiceReport(true);
      }
    } catch (error) {
      console.error('리포트 확인 실패:', error);
    }
  };

  const forceCheckVoiceReport = async () => {
    try {
      console.log('========== 수동 리포트 확인 ==========');
      const response = await fetch(`${BASE_URL}/voice/analysis_report`);
      
      if (!response.ok) {
        throw new Error(`서버 응답 실패: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.overall_score !== undefined && data.overall_score > 0) {
        console.log('리포트 발견!');
        
        // 수동 확인 시에만 타임스탬프 강제 업데이트
        if (data.analysis_timestamp) {
          lastReportTimestampRef.current = data.analysis_timestamp;
        }
        reportShownRef.current = true;
        
        setVoiceAnalysisReport(data);
        setShowVoiceReport(true);
      } else if (data.message) {
        alert(`음성 분석 상태:\n\n${data.message}`);
      } else {
        alert('음성 분석 리포트가 아직 준비되지 않았습니다.');
      }
    } catch (error) {
      console.error('리포트 확인 실패:', error);
      alert(`리포트 확인 실패:\n\n${error.message}`);
    }
  };

  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch(`${BASE_URL}/health`);
        setIsServerConnected(response.ok);
      } catch {
        setIsServerConnected(false);
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 10000);
    return () => clearInterval(interval);
  }, []);

// 컴포넌트 정리 useEffect 수정
useEffect(() => {
  return () => {
    console.log('컴포넌트 정리');
    
    // interval 정리
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
    
    stopSendingFrames();
    stopSpeech();
    stopVoiceAnalysis();
    stopMicTest();
  };
}, []);




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

  const getVoiceLevelColor = (level) => {
    if (level < 20) return '#999';
    if (level < 50) return '#ffeb3b';
    if (level < 80) return '#4caf50';
    return '#ff5722';
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>체육대학 육상전공 면접 연습 (WebRTC 방식)</h1>
        <div className={`connection-status ${isServerConnected ? 'connected' : 'disconnected'}`}>
          {isServerConnected ? '서버 연결됨' : '서버 연결 안됨'}
        </div>
      </div>

      {!isAnalyzing && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white',
          padding: '20px',
          borderRadius: '12px',
          margin: '20px 0',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 15px 0' }}>마이크 테스트</h3>
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
              fontWeight: 'bold'
            }}
          >
            {micTestActive ? '테스트 중지' : '마이크 테스트 시작'}
          </button>
          
          {micTestActive && (
            <div style={{ marginTop: '15px' }}>
              <div style={{ fontSize: '14px', marginBottom: '10px' }}>
                지금 마이크에 말해보세요! (10초간 테스트)
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
          
          {micTestResults && !micTestResults.error && (
            <div style={{
              background: micTestResults.signalDetected ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
              padding: '10px',
              borderRadius: '8px',
              marginTop: '15px',
              fontSize: '14px'
            }}>
              <div>최대: {micTestResults.maxVolume.toFixed(1)}% | 평균: {micTestResults.avgVolume.toFixed(1)}%</div>
              <div>{micTestResults.signalDetected ? '마이크 정상 작동!' : '신호 감지 안됨'}</div>
            </div>
          )}
        </div>
      )}

      {interviewData.active && interviewData.current_question && (
        <div className="interview-panel">
          <div className="interview-info">
            <div className="interview-meta">
              <span className="question-counter">질문 {interviewData.question_number}/{interviewData.total_questions}</span>
              <span className="category-badge">{interviewData.category}</span>
              <span className={`phase-indicator ${interviewData.phase === 'thinking' ? 'phase-thinking' : 'phase-answering'}`}>
                {interviewData.phase === 'thinking' && <Brain />}
                {getPhaseText(interviewData.phase)}: {interviewData.time_remaining}초
              </span>
            </div>
            
            <div className="current-question">
              {interviewData.current_question}
            </div>
            
            {voiceAnalysisActive && (
              <div className="voice-analysis-panel">
                <div className="voice-indicator">
                  <Mic />
                  <span>음성 분석 중</span>
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
              <button className="btn-stop-interview" onClick={stopInterview}>
                면접 중지
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="video-container" style={{ position: 'relative' }}>
        <canvas 
          ref={canvasRef}
          style={{
            display: isAnalyzing ? 'block' : 'none',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            background: '#000'
          }}
        />
        
        <video 
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ display: 'none' }}
        />
        
        {cameraLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            zIndex: 2000
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '5px solid rgba(255,255,255,0.3)',
              borderTop: '5px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ marginTop: '20px', fontSize: '18px' }}>카메라 준비 중...</p>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}
        
        {currentIssues.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'rgba(255, 0, 0, 0.8)',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            maxWidth: '300px',
            zIndex: 1000
          }}>
            <AlertCircle style={{ display: 'inline', marginRight: '8px' }} />
            <strong>자세 피드백:</strong>
            {currentIssues.map((issue, idx) => (
              <div key={idx} style={{ marginTop: '5px' }}>• {issue}</div>
            ))}
          </div>
        )}
        
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: postureScore >= 80 ? 'rgba(76, 175, 80, 0.9)' : 
                     postureScore >= 60 ? 'rgba(255, 193, 7, 0.9)' : 
                     'rgba(244, 67, 54, 0.9)',
          color: 'white',
          padding: '15px 25px',
          borderRadius: '50%',
          fontSize: '24px',
          fontWeight: 'bold',
          minWidth: '60px',
          minHeight: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          {postureScore}
        </div>
        
        {!isAnalyzing && !cameraLoading && (
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
          onClick={isAnalyzing ? stopAnalysis : startAnalysis}
          disabled={!isServerConnected}
          className={`btn-main ${!isServerConnected ? 'disabled' : isAnalyzing ? 'stop' : 'start'}`}
        >
          {isAnalyzing ? '분석 중지' : '분석 시작'}
        </button>
        
        {isAnalyzing && !interviewData.active && (
          <button onClick={startInterview} className="btn-interview">
            <MessageSquare />
            면접 시작
          </button>
        )}
        
        <button
          onClick={() => {
            setVoiceEnabled(!voiceEnabled);
            if (!voiceEnabled && interviewData.current_question) {
              speakQuestion(interviewData.current_question);
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
          {voiceAnalysisEnabled ? ' 음성분석 ON' : ' 음성분석 OFF'}
        </button>
        
        {voiceAnalysisReport && (
          <button onClick={() => setShowVoiceReport(true)} className="btn-voice-report">
            <BarChart />
            음성 분석 결과
          </button>
        )}
        
        {!interviewData.active && (
          <button
            onClick={forceCheckVoiceReport}
            style={{
              background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)'
            }}
          >
            리포트 확인
          </button>
        )}
      </div>

      {isAnalyzing && !interviewData.active && (
        <div className="interview-guide">
          <h3>면접 연습 가이드 (WebRTC 방식)</h3>
          <div className="guide-content">
            <div className="guide-item">
              <span className="guide-icon">📹</span>
              <span><strong>WebRTC</strong>로 브라우저 카메라를 사용합니다</span>
            </div>
            <div className="guide-item">
              <span className="guide-icon">💭</span>
              <span>질문 후 <strong>10초 생각 시간</strong>이 주어집니다</span>
            </div>
            <div className="guide-item">
              <span className="guide-icon">🗣️</span>
              <span><strong>60초 답변 시간</strong> 동안 자유롭게 답변하세요</span>
            </div>
            <div className="guide-item">
              <span className="guide-icon">🎤</span>
              <span><strong>AI 음성 분석</strong>으로 추임새와 발음을 분석합니다</span>
            </div>
          </div>
        </div>
      )}
      
      {showVoiceReport && voiceAnalysisReport && (
        <VoiceAnalysisReport 
          report={voiceAnalysisReport} 
          show={showVoiceReport} 
          onClose={() => setShowVoiceReport(false)} 
        />
      )}
    </div>
  );
}

// 음성 분석 리포트 컴포넌트
function VoiceAnalysisReport({ report, show, onClose }) {
  if (!report || !show) return null;
  
  const hasAI = report.ai_powered;
  const aiDetails = report.ai_details;
  const details = report.detailed_analysis;

  // 닫기 핸들러
  const handleClose = (e) => {
    e.stopPropagation();
    console.log('리포트 닫기');
    onClose();
  };

  // 배경 클릭 핸들러
  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      console.log('리포트 배경 클릭 - 닫기');
      onClose();
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
      onClick={handleBackgroundClick}
    >
      <div 
        style={{
          background: 'white',
          borderRadius: '16px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          padding: '20px 30px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'white',
          zIndex: 1
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            음성 분석 결과 {hasAI && <span style={{fontSize: '14px', color: '#4CAF50', marginLeft: '8px'}}>AI 분석</span>}
          </h2>
          <button 
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: '#999',
              padding: '0',
              lineHeight: 1,
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#f0f0f0'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            ✕
          </button>
        </div>
        
        <div style={{ padding: '30px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{
              display: 'inline-flex',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: report.overall_score >= 80 ? '#4CAF50' : 
                         report.overall_score >= 60 ? '#FFC107' : '#F44336',
              color: 'white',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
            }}>
              <span style={{ fontSize: '48px', fontWeight: 'bold', lineHeight: 1 }}>{report.overall_score}</span>
              <span style={{ fontSize: '14px', marginTop: '8px', opacity: 0.9 }}>종합 점수</span>
            </div>
          </div>
          
          <div style={{ marginBottom: '30px' }}>
            <MetricBar label="음성 자신감" value={details.voice_confidence} />
            <MetricBar label="음량 일관성" value={details.volume_consistency} />
            <MetricBar label="음성 안정성" value={details.voice_stability} />
            
            {hasAI && details.jitter_percent !== undefined && (
              <MetricBar 
                label="음정 떨림" 
                value={Math.max(0, 100 - details.jitter_percent * 20)}
                rawValue={`${details.jitter_percent.toFixed(2)}%`}
                color={details.jitter_percent < 2 ? '#4CAF50' : details.jitter_percent < 3.5 ? '#FFC107' : '#F44336'}
              />
            )}
            
            {hasAI && details.average_pitch !== undefined && (
              <MetricBar 
                label="평균 음높이" 
                value={70}
                rawValue={`${details.average_pitch.toFixed(0)} Hz`}
                color="#2196F3"
              />
            )}
            
            {hasAI && details.vocabulary_richness !== undefined && (
              <MetricBar 
                label="어휘 다양성" 
                value={details.vocabulary_richness}
              />
            )}
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '15px',
            marginBottom: '25px',
            padding: '20px',
            background: '#f9f9f9',
            borderRadius: '12px'
          }}>
            <StatItem label="말하기 시간" value={`${details.total_speaking_time}초`} />
            <StatItem label="추임새 사용" value={`${details.filler_word_count}회 (${details.filler_ratio}%)`} />
            {hasAI && details.connective_count !== undefined && (
              <StatItem label="접속사 사용" value={`${details.connective_count}회`} />
            )}
            {hasAI && details.avg_sentence_length !== undefined && (
              <StatItem label="평균 문장 길이" value={`${details.avg_sentence_length.toFixed(1)}단어`} />
            )}
          </div>
          
          {hasAI && aiDetails && aiDetails.recognized_text && (
            <div style={{
              background: '#f5f5f5',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '20px',
              maxHeight: '200px',
              overflow: 'auto',
              border: '1px solid #e0e0e0'
            }}>
              <h4 style={{margin: '0 0 12px 0', fontSize: '15px', color: '#666', fontWeight: '600'}}>
                Whisper 인식 텍스트:
              </h4>
              <p style={{margin: 0, fontSize: '14px', lineHeight: '1.8', color: '#333'}}>
                {aiDetails.recognized_text}
              </p>
            </div>
          )}
          
          {hasAI && aiDetails && (
            <div style={{
              background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '20px',
              border: '1px solid #90caf9'
            }}>
              <h4 style={{margin: '0 0 15px 0', fontSize: '16px', color: '#1976D2', fontWeight: 'bold'}}>
                AI 상세 분석
              </h4>
              
              {aiDetails.filler_words && Object.keys(aiDetails.filler_words).length > 0 && (
                <DetailSection title="추임새 분석" items={aiDetails.filler_words} />
              )}
              
              {aiDetails.connectives && Object.keys(aiDetails.connectives).length > 0 && (
                <DetailSection title="접속사 분석" items={aiDetails.connectives} />
              )}
              
              {aiDetails.top_nouns && Object.keys(aiDetails.top_nouns).length > 0 && (
                <DetailSection 
                  title="자주 사용한 단어" 
                  items={Object.fromEntries(Object.entries(aiDetails.top_nouns).slice(0, 8))} 
                />
              )}
            </div>
          )}
          
          <div style={{
            background: '#fff3e0',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #ffb74d'
          }}>
            <h3 style={{ fontSize: '18px', marginBottom: '15px', color: '#f57c00', fontWeight: 'bold' }}>
              개선 제안
            </h3>
            <ul style={{ margin: 0, padding: '0 0 0 20px' }}>
              {report.recommendations.map((rec, index) => (
                <li key={index} style={{ 
                  marginBottom: '10px', 
                  lineHeight: '1.6',
                  fontSize: '14px',
                  color: '#424242'
                }}>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
          
          {report.debug_info && (
            <div style={{
              fontSize: '11px',
              color: '#999',
              marginTop: '20px',
              padding: '12px',
              background: '#fafafa',
              borderRadius: '8px',
              border: '1px solid #eee'
            }}>
              <div>분석 샘플: {report.debug_info.samples_analyzed}개</div>
              <div>청크 수신: {report.debug_info.chunks_received}개</div>
              {hasAI && (
                <>
                  <div>Whisper: {report.debug_info.has_whisper ? '활성' : '비활성'}</div>
                  <div>librosa: {report.debug_info.has_librosa ? '활성' : '비활성'}</div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricBar({ label, value, rawValue, color = '#4CAF50' }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '6px'
      }}>
        <span style={{ fontSize: '14px', fontWeight: '500', color: '#555' }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#333' }}>
          {rawValue || `${value}%`}
        </span>
      </div>
      <div style={{ 
        background: '#eee', 
        height: '10px', 
        borderRadius: '5px', 
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          width: `${value}%`, 
          height: '100%', 
          background: color,
          transition: 'width 0.5s ease',
          borderRadius: '5px'
        }}></div>
      </div>
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>{value}</div>
    </div>
  );
}

function DetailSection({ title, items }) {
  return (
    <div style={{ marginBottom: '15px' }}>
      <strong style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#555' }}>
        {title}:
      </strong>
      <div style={{ fontSize: '13px' }}>
        {Object.entries(items).map(([word, count]) => (
          <span key={word} style={{
            display: 'inline-block',
            background: 'white',
            padding: '5px 12px',
            borderRadius: '16px',
            margin: '4px',
            border: '1px solid #ddd',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            "{word}" <strong>{count}회</strong>
          </span>
        ))}
      </div>
    </div>
  );
}