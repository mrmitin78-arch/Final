import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex items-center h-full flex-1 justify-center bg-base-200">
      <div className="text-center">
        <h1 className="text-6xl font-bold m-0 mb-1">404</h1>
        <h2 className="text-2xl font-semibold m-0">Страница не найдена</h2>
        <p className="text-base-content/70 m-0 mb-4">Такого раздела в приложении нет.</p>
        <Link href="/" className="btn btn-primary">
          На главную
        </Link>
      </div>
    </div>
  );
}
