import React, { useCallback, useEffect, useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { getLocale } from '@penta-b/ma-lib';
import { withLocalize } from '@penta-b/ma-lib';
import { LOCALIZATION_NAMESPACE } from '../../constants/constants';
import { debounce } from '../../utils/helperFunctions';
import CustomButton from '../CustomButton';
import { connect } from 'react-redux';
const SpeechToText = ({ userQuery, setUserQuery, t }) => {
    const [inputValue, setInputValue] = useState(userQuery);
    const locale = getLocale()?.name || "ar";

    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();


    const debouncedSetUserQuery = useCallback(
        debounce((value) => {
            setUserQuery(value);
        }, 600),
        []
    );

    useEffect(() => {
        if (transcript !== "" && transcript !== userQuery && !listening) {
            setUserQuery(transcript);
            setInputValue(transcript);

        }
    }, [transcript, listening]);

    const startRecording = () => {
        setUserQuery("");
        setInputValue("");

        resetTranscript();
        SpeechRecognition.startListening({ language: locale.toLowerCase() == "ar" ? "ar-eg" : "en-US", continues: true });
    };

    const stopRecording = () => {
        SpeechRecognition.stopListening();
    };

    const handleTyping = (e) => {
        const value = e.target.value;
        setInputValue(value);
        debouncedSetUserQuery(value);
    };

    useEffect(() => {
        return () => {
            debouncedSetUserQuery.cancel();
        };
    }, [debouncedSetUserQuery]);


    if (!browserSupportsSpeechRecognition) {
        return <span>Browser doesn't support speech recognition.</span>;
    }

    return (
        <div className='penta-container-space-between'>
            <input
                className='penta-textbox'
                value={listening ? transcript : inputValue}
                onChange={handleTyping}
                placeholder="Describe desired map/data interaction"
            />
            <div className='penta-buttons-container'>
                <CustomButton className={listening ? 'penta-button-svg-title penta-sub-button' : 'penta-button-svg-title penta-main-button'} onClick={listening ? stopRecording : startRecording} label={listening ? t("Disable-Mic") : t("Enable-mic")} title={listening ? t("Disable-Voice-Recognition") : t("Enable-Vocie-Recognition")} iconKey={listening ? t('deactivateMic') : t('activateMic')} />
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