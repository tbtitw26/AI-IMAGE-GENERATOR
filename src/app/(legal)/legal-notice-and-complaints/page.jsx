import LegalPolicyPage from '@/components/common/LegalPolicyPage';
import styles from '../cookie-policy/page.module.scss';
import { LEGAL_NOTICE_POLICY } from '@/data/legalPoliciesDocument';

export default function LegalNoticeAndComplaintsPage() {
  return <LegalPolicyPage policy={LEGAL_NOTICE_POLICY} styles={styles} badge="Legal & Support" icon="contact_support" description="Company information, customer support contacts and the procedure for submitting complaints to Dexeric OÜ." />;
}
