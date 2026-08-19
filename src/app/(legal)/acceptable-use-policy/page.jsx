import LegalPolicyPage from '@/components/common/LegalPolicyPage';
import styles from './page.module.scss';
import { ACCEPTABLE_USE_POLICY } from '@/data/legalPoliciesDocument';

export default function AcceptableUsePolicyPage() {
  return <LegalPolicyPage policy={ACCEPTABLE_USE_POLICY} styles={styles} badge="Safety & Compliance" icon="rule" description="Rules for safe, lawful and responsible use of the Dexeric AI image generation service." />;
}
