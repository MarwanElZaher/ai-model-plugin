import React, { useEffect, useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { getChatResponse } from '../Geminimodel';
import { connect } from 'react-redux';
import { clearResponse, setModelResponse } from '../../actions/actions';
import { withLocalize } from '@penta-b/ma-lib';
import { LOCALIZATION_NAMESPACE } from '../../constants/constants';
import { geminiResponseHandler } from '../../utils/helperFunctions';
const ModalPreview = ({ setResponse, modelResponse, clearModelResponse }) => {
  const [lastTranscript, setLastTranscript] = useState("");
  const [error, setError] = useState(null);
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript !== lastTranscript && !listening) {
      setLastTranscript(transcript);
      handleSend(transcript);
    }
  }, [transcript, listening, lastTranscript]);

  const startRecording = () => {
    resetTranscript();
    clearModelResponse();

    SpeechRecognition.startListening({ language: "ar-eg", continues: true });
  };

  const stopRecording = () => {
    SpeechRecognition.stopListening();
  };

  const handleSend = async (text) => {
    try {
      const response = await getChatResponse(text);
      if (!response) return;
      setResponse(response);
      geminiResponseHandler(response);
    } catch (err) {
      setError('Error fetching response');
      console.error('Error fetching response:', err);
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  return (
    <div className='chat-model-container'>
      <p>Microphone: {listening ? 'on' : 'off'}</p>
      <button onClick={startRecording}>Start</button>
      <button onClick={stopRecording}>Stop</button>
      <div className='message-container'>
        <label>Message:</label>
        <p>{transcript}</p>
      </div>
      <div className='response-container'>
        {error && <p className='error-message'>Error: {error}</p>}
        <p><strong>Action:</strong> {modelResponse.action && modelResponse.action}</p>
        <p><strong>Target:</strong>   {modelResponse.target && modelResponse.target}</p>
        <p><strong>Message:</strong> {modelResponse.message && modelResponse.message}</p>
      </div>
    </div>
  );
};

const mapStateToProps = (state, ownProps) => {
  return {
    modelResponse: state.reducer.response,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setResponse: (modelResponse) => dispatch(setModelResponse(modelResponse)),
    clearModelResponse: () => dispatch(clearResponse()),
  }
};

export default withLocalize(connect(mapStateToProps, mapDispatchToProps)(ModalPreview), LOCALIZATION_NAMESPACE);