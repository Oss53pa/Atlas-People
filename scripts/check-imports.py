#!/usr/bin/env python
"""Scan exhaustif des imports manquants dans les .tsx Atlas People.
Detecte :
  - Icones lucide-react referencees sans etre dans l'import line
  - Composants JSX <Foo /> non importes (ni definis localement)
"""
import re, os, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

LUCIDE_KNOWN = {
    'Activity','AlertCircle','AlertTriangle','Archive','ArrowDown','ArrowDownToLine','ArrowDownRight',
    'ArrowLeft','ArrowLeftRight','ArrowRight','ArrowRightLeft','ArrowUpFromLine','ArrowUpRight',
    'Award','BadgeCheck','Banknote','BarChart3','Bell','BookOpen','BookOpenCheck','Brain','Briefcase',
    'Building2','Bug','Calculator','Calendar','CalendarClock','CalendarDays','CalendarRange','Car',
    'Check','CheckCircle2','ChevronLeft','ChevronRight','ChevronDown','ChevronUp','ClipboardCheck',
    'ClipboardList','Clock','Cog','Compass','CreditCard','Crosshair','Crown','Cpu','Download','Eye',
    'FileLock2','FileSearch','FileSignature','Filter','Flame','FlaskConical','FlaskConicalOff',
    'Gauge','GitBranch','Gift','Globe','GraduationCap','Hammer','Hash','Heart','HeartPulse',
    'KanbanSquare','Landmark','Layers','LayoutDashboard','LayoutGrid','Leaf','Lightbulb','Lock',
    'Mail','Map','Megaphone','Menu','MessageSquare','Mic','Monitor','Network','Plus','Printer',
    'Receipt','ReceiptText','RotateCcw','Route','Rocket','Save','Scale','ScrollText','Search',
    'Send','Settings','Shield','ShieldAlert','ShieldCheck','ShieldX','Smartphone','Sparkles',
    'Star','Stethoscope','Target','Timer','TrendingDown','TrendingUp','Trash2','User','UserCheck',
    'UserMinus','UserPlus','UserSearch','Users','Video','Wallet','X','XCircle','Zap','ZapOff',
}
RR_BUILTINS = {'Route','Routes','Outlet','Fragment','Suspense','Link','NavLink','Navigate','BrowserRouter','HashRouter'}
UI_BUILTINS = {'StrictMode','React','Component','PureComponent','Children'}

issues = []
for root, _, files in os.walk('src'):
    for fn in files:
        if not fn.endswith('.tsx'): continue
        path = os.path.join(root, fn).replace(os.sep, '/')
        with open(path, 'r', encoding='utf-8') as f:
            src = f.read()
        imports = set()
        for m in re.finditer(r'import(?:\s+type)?\s*\{([^}]+)\}\s*from', src, re.DOTALL):
            for s in m.group(1).split(','):
                name = s.strip().split(' as ')[-1].strip()
                if name: imports.add(name)
        for m in re.finditer(r'import\s+([A-Za-z_][\w]*)\s+from', src):
            imports.add(m.group(1))
        body_lucide_used = set()
        for line in src.split('\n'):
            ls = line.strip()
            if ls.startswith('import') or ls.startswith('//') or ls.startswith('*'): continue
            for m in re.finditer(r'\b([A-Z][a-zA-Z0-9]+)\b', line):
                if m.group(1) in LUCIDE_KNOWN:
                    body_lucide_used.add(m.group(1))
        missing_icons = sorted(body_lucide_used - imports)
        jsx_refs = set(re.findall(r'<([A-Z][a-zA-Z0-9]+)\b', src))
        locally_defined = set(re.findall(r'(?:function|const|let|var|class)\s+([A-Z][a-zA-Z0-9]+)\b', src))
        missing_jsx = sorted(jsx_refs - imports - RR_BUILTINS - UI_BUILTINS - locally_defined)
        if missing_icons or missing_jsx:
            issues.append((path, missing_icons, missing_jsx))

if not issues:
    print('OK - aucun import manquant detecte')
    sys.exit(0)
else:
    print(f'[!] {len(issues)} fichier(s) avec import manquant:')
    for path, icons, jsx in issues:
        print(f'\n  {path}')
        if icons: print(f'    Lucide icons: {icons}')
        if jsx:   print(f'    JSX comps:    {jsx}')
    sys.exit(1)
