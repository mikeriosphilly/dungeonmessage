import logo from "/Logo_TableWhisper.png";

export default function AppHeader() {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b"
      style={{
        background: "var(--tw-header)",
        borderColor: "var(--tw-border)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-center px-6 py-4">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="TableWhisper logo"
            className="h-9 w-9 rounded-xl"
            style={{
              boxShadow: "var(--tw-shadow)",
            }}
          />

          <div className="text-base font-extrabold tracking-wide text-white">
            TABLEWHISPER
          </div>
        </div>
      </div>
    </header>
  );
}
