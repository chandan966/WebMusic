import { X } from 'lucide-react';
import './NoticeToast.css';

export default function NoticeToast({ notice, setNotice }) {
  if (!notice) return null;

  return (
    <button className="toast" onClick={() => setNotice('')}>
      {notice}
      <X size={14} />
    </button>
  );
}
