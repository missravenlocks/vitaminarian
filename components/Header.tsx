import SpinachLogo from "./SpinachLogo";

export default function Header() {
  return (
    <header className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-emerald-100">
      <div className="flex items-center gap-4">
        <SpinachLogo className="h-12 w-12 shrink-0" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Vitaminarian
          </h1>
          <p className="text-sm text-slate-600">
            Customized nutrition tracking
          </p>
        </div>
      </div>
    </header>
  );
}
