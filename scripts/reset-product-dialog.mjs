import fs from 'node:fs';
const path = '/home/ubuntu/gestao-vestuario/client/src/pages/Home.tsx';
let s = fs.readFileSync(path, 'utf8');
const anchor = 'const [imageDataUrl, setImageDataUrl] = useState(""); return <Dialog open={open} onOpenChange={onOpenChange}>';
const replacement = 'const [imageDataUrl, setImageDataUrl] = useState(""); const resetForm = () => { setName(""); setTeam(""); setLeague(""); setCollection(""); setCategory("Torcedor"); setSize(""); setUsd(""); setPrice(""); setImageDataUrl(""); }; useEffect(() => { if (!open) resetForm(); }, [open]); return <Dialog open={open} onOpenChange={nextOpen => { if (!nextOpen) resetForm(); onOpenChange(nextOpen); }}>';
if (!s.includes(anchor)) throw new Error('ProductDialog anchor not found');
s = s.replace(anchor, replacement);
fs.writeFileSync(path, s);
console.log('ProductDialog agora reseta seus campos ao fechar.');
