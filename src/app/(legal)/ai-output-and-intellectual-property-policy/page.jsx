import LegalPolicyPage from '@/components/common/LegalPolicyPage';
import styles from '../cookie-policy/page.module.scss';
import { AI_OUTPUT_POLICY } from '@/data/legalPoliciesDocument';

export default function AIOutputAndIntellectualPropertyPolicyPage() {
  return <LegalPolicyPage policy={AI_OUTPUT_POLICY} styles={styles} badge="Content & Intellectual Property" icon="copyright" description="How Inputs, AI-generated Outputs and intellectual-property rights are treated on Dexeric AI." />;
}
