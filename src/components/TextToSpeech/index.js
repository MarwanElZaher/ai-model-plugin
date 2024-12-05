import { EdgeSpeechTTS } from '@lobehub/tts';
import { useCallback, useEffect } from 'react';
import { LOCALIZATION_NAMESPACE } from '../../constants/constants';
import { withLocalize } from '@penta-b/ma-lib';
import { connect } from 'react-redux';

const TextToSpeech = ({ message }) => {
    const isArabic = (text) => /[\u0600-\u06FF]/.test(text);

    const getVoiceConfig = (text) => {
        return isArabic(text)
            ? { locale: 'ar-SA', voice: 'ar-SA-HamedNeural' }
            : { locale: 'en-US', voice: 'en-US-GuyNeural' };
    };

    useEffect(() => {
        if (!message) return;
        handlePlay();
    }, [message]);

    const handlePlay = useCallback(async () => {
        try {
            const voiceConfig = getVoiceConfig(message);
            const tts = new EdgeSpeechTTS({ locale: voiceConfig.locale });

            const payload = {
                input: message,
                options: { voice: voiceConfig.voice },
            };

            const response = await tts.create(payload);
            const audioData = await response.arrayBuffer();
            const audioBlob = new Blob([audioData], { type: 'audio/mp3' });
            const audioUrl = URL.createObjectURL(audioBlob);

            const audio = new Audio(audioUrl);
            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
            };

            await audio.play();
        } catch (error) {
            console.error('TTS Error:', error);
        }
    }, [message]);

    return null;
};

const mapStateToProps = (state, ownProps) => ({
    message: state.reducer.modalMessage
});

export default withLocalize(connect(mapStateToProps, null)(TextToSpeech), LOCALIZATION_NAMESPACE);