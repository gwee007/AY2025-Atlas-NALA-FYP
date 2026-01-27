import { Box } from '@mui/material';
import HeroSection from '../components/chatbot/HeroSection';
import AssessmentFlowSection from '../components/chatbot/AssessmentFlowSection';
import SoloTaxonomySection from '../components/chatbot/SoloTaxonomySection';
import CTASection from '../components/chatbot/CTASection';

export default function ChatbotPage() {
  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: '#fff', overflowX: 'hidden' }}>
      <HeroSection />
      <AssessmentFlowSection />
      <SoloTaxonomySection />
      <CTASection />
    </Box>
  );
}