import React, { useEffect, useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { connect } from 'react-redux';
import { withLocalize } from '@penta-b/ma-lib';
import { LOCALIZATION_NAMESPACE } from '../../constants/constants';
const SpeechToText = ({ lastTranscript, setLastTranscript }) => {
    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();

    useEffect(() => {
        if (transcript !== lastTranscript && !listening) {
            setLastTranscript(transcript);
        }
    }, [transcript, listening, lastTranscript]);

    const startRecording = () => {
        resetTranscript();
        SpeechRecognition.startListening({ language: "ar-eg", continues: true });
    };

    const stopRecording = () => {
        SpeechRecognition.stopListening();
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

        </div>
    );
};

const mapStateToProps = (state, ownProps) => {
    return {
    };
};

const mapDispatchToProps = (dispatch) => {
    return {

    }
};

export default withLocalize(connect(mapStateToProps, mapDispatchToProps)(SpeechToText), LOCALIZATION_NAMESPACE);