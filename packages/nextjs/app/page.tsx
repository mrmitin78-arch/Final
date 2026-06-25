"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { isAddress, keccak256 } from "viem";
import { useAccount, useSwitchChain } from "wagmi";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  FingerPrintIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import {
  useHashStorageEvents,
  useHashStorageNetwork,
  useHashStorageRead,
  useHashStorageWrite,
} from "~~/hooks/hashstorage";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const BYTES32_REGEX = /^0x[a-fA-F0-9]{64}$/;

type Bytes32 = `0x${string}`;

const formatTimestamp = (timestamp?: bigint) => {
  if (!timestamp) return "Не найдено";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(Number(timestamp) * 1000);
};

const compactHash = (hash?: string) => {
  if (!hash) return "Хеш не рассчитан";

  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
};

const Home: NextPage = () => {
  const { address: connectedAddress, chainId: connectedChainId, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { targetNetwork } = useHashStorageNetwork();
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [fileHash, setFileHash] = useState<Bytes32>();
  const [manualHash, setManualHash] = useState("");
  const [isHashing, setIsHashing] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeHash = useMemo(() => {
    const trimmedHash = manualHash.trim();
    if (BYTES32_REGEX.test(trimmedHash)) return trimmedHash as Bytes32;
    return fileHash;
  }, [fileHash, manualHash]);

  const isManualHashInvalid = manualHash.trim().length > 0 && !BYTES32_REGEX.test(manualHash.trim());

  const { data: isHashStored, refetch: refetchStoredStatus } = useHashStorageRead({
    contractName: "HashStorage",
    functionName: "isHashStored",
    args: [activeHash],
    watch: true,
  });

  const { data: hashDetails, refetch: refetchHashDetails } = useHashStorageRead({
    contractName: "HashStorage",
    functionName: "getHashDetails",
    args: [activeHash],
    watch: true,
  });

  const { data: recentEvents, isLoading: isEventsLoading } = useHashStorageEvents({
    contractName: "HashStorage",
    eventName: "HashStored",
    fromBlock: 1n,
    watch: true,
  });

  const { writeContractAsync, isMining } = useHashStorageWrite({
    contractName: "HashStorage",
  });

  const storer = hashDetails?.[0];
  const timestamp = hashDetails?.[1];
  const hasStoredDetails = Boolean(isHashStored && storer && isAddress(storer) && storer !== ZERO_ADDRESS);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setCopied(false);
    setManualHash("");

    if (!file) {
      setFileName("");
      setFileSize(0);
      setFileHash(undefined);
      return;
    }

    try {
      setIsHashing(true);
      const fileBytes = new Uint8Array(await file.arrayBuffer());
      setFileName(file.name);
      setFileSize(file.size);
      setFileHash(keccak256(fileBytes));
    } catch (error) {
      notification.error(getParsedError(error));
      setFileHash(undefined);
    } finally {
      setIsHashing(false);
    }
  };

  const handleStoreHash = async () => {
    if (!activeHash) {
      notification.warning("Сначала выберите файл или введите bytes32-хеш");
      return;
    }

    if (!isConnected) {
      notification.warning("Подключите MetaMask");
      return;
    }

    if (connectedChainId !== targetNetwork.id) {
      try {
        await switchChainAsync({ chainId: targetNetwork.id });
        notification.success("Сеть переключена. Нажмите «Записать хеш» ещё раз");
      } catch (error) {
        notification.error(getParsedError(error));
      }
      return;
    }

    try {
      await writeContractAsync(
        {
          functionName: "storeHash",
          args: [activeHash],
        },
        {
          onBlockConfirmation: async () => {
            await Promise.all([refetchStoredStatus(), refetchHashDetails()]);
            notification.success("Хеш зафиксирован в контракте");
          },
        },
      );
    } catch (error) {
      notification.error(getParsedError(error));
    }
  };

  const handleManualCheck = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeHash || isManualHashInvalid) {
      notification.warning("Введите корректный bytes32-хеш");
      return;
    }

    refetchStoredStatus();
    refetchHashDetails();
  };

  const handleCopyHash = async () => {
    if (!activeHash) return;

    await navigator.clipboard.writeText(activeHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const latestEvents = recentEvents?.slice(0, 5) ?? [];

  return (
    <div className="flex flex-col grow bg-base-200">
      <section className="bg-base-100 border-b border-base-300">
        <div className="container mx-auto px-5 py-8 lg:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 text-primary font-semibold">
                <ShieldCheckIcon className="h-6 w-6" />
                <span>HashStorage DApp</span>
              </div>
              <h1 className="mt-3 text-3xl font-bold leading-tight lg:text-5xl">Хранилище хешей документов</h1>
              <p className="mt-4 max-w-2xl text-base-content/70">
                Фиксируйте цифровой отпечаток файла в локальной Ethereum-сети и проверяйте запись по хешу.
              </p>
            </div>

            <div className="stats stats-vertical sm:stats-horizontal bg-base-200 border border-base-300 shadow-sm">
              <div className="stat">
                <div className="stat-title">Сеть</div>
                <div className="stat-value text-lg">{targetNetwork.name}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Кошелек</div>
                <div className="stat-value text-sm">
                  {isConnected ? <Address address={connectedAddress} chain={targetNetwork} /> : "Не подключен"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto grid gap-5 px-5 py-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <div className="flex flex-col gap-5">
          <div className="card bg-base-100 border border-base-300 shadow-sm">
            <div className="card-body gap-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="card-title text-xl">Файл</h2>
                  <p className="text-sm text-base-content/60">Keccak256 рассчитывается локально в браузере.</p>
                </div>
                <div className="badge badge-primary badge-outline">bytes32</div>
              </div>

              <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-base-300 bg-base-200 p-6 text-center transition hover:border-primary hover:bg-base-300">
                <DocumentArrowUpIcon className="h-12 w-12 text-primary" />
                <div>
                  <div className="font-semibold">{fileName || "Выберите документ"}</div>
                  <div className="mt-1 text-sm text-base-content/60">
                    {fileName ? `${(fileSize / 1024).toFixed(2)} КБ` : "PDF, DOCX, PNG или любой другой файл"}
                  </div>
                </div>
                <input className="hidden" type="file" onChange={handleFileChange} />
              </label>

              <div className="rounded-lg bg-base-200 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-base-content/70">Рассчитанный хеш</span>
                  <button className="btn btn-ghost btn-xs" disabled={!activeHash} onClick={handleCopyHash}>
                    <ClipboardDocumentIcon className="h-4 w-4" />
                    {copied ? "Скопирован" : "Копировать"}
                  </button>
                </div>
                <div className="min-h-12 break-all rounded-md bg-base-100 px-3 py-3 font-mono text-sm">
                  {isHashing ? <span className="loading loading-dots loading-sm" /> : activeHash || "0x..."}
                </div>
              </div>

              <button
                className="btn btn-primary"
                disabled={!activeHash || isManualHashInvalid || Boolean(isHashStored) || isMining || isHashing}
                onClick={handleStoreHash}
              >
                {isMining ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <FingerPrintIcon className="h-5 w-5" />
                )}
                {isHashStored ? "Хеш уже записан" : "Записать хеш"}
              </button>
            </div>
          </div>

          <div className="card bg-base-100 border border-base-300 shadow-sm">
            <div className="card-body gap-4">
              <h2 className="card-title text-xl">Проверка по хешу</h2>
              <form className="flex w-full flex-col gap-3 sm:flex-row" onSubmit={handleManualCheck}>
                <input
                  className={`input input-bordered w-full font-mono text-sm ${isManualHashInvalid ? "input-error" : ""}`}
                  placeholder="0x..."
                  value={manualHash}
                  onChange={event => setManualHash(event.target.value)}
                />
                <button
                  className="btn btn-secondary sm:w-auto"
                  type="submit"
                  disabled={!activeHash || isManualHashInvalid}
                >
                  <ArrowPathIcon className="h-5 w-5" />
                  Проверить
                </button>
              </form>
              {isManualHashInvalid && (
                <div className="alert alert-error py-2 text-sm">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  <span>Хеш должен быть в формате 0x + 64 шестнадцатеричных символа.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-5">
          <div className="card bg-base-100 border border-base-300 shadow-sm">
            <div className="card-body gap-4">
              <h2 className="card-title text-xl">Статус записи</h2>
              <div className={`alert ${isHashStored ? "alert-success" : "alert-warning"}`}>
                {isHashStored ? (
                  <CheckCircleIcon className="h-6 w-6" />
                ) : (
                  <ExclamationTriangleIcon className="h-6 w-6" />
                )}
                <span>{isHashStored ? "Хеш найден в контракте" : "Хеш не найден"}</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-xs uppercase text-base-content/50">Хеш</div>
                  <div className="mt-1 break-all font-mono text-sm">{compactHash(activeHash)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-base-content/50">Автор записи</div>
                  <div className="mt-1">
                    {hasStoredDetails ? <Address address={storer} chain={targetNetwork} /> : <span>Не найдено</span>}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase text-base-content/50">Дата и время</div>
                  <div className="mt-1 font-medium">{hasStoredDetails ? formatTimestamp(timestamp) : "Не найдено"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 border border-base-300 shadow-sm">
            <div className="card-body gap-4">
              <h2 className="card-title text-xl">Последние записи</h2>
              {isEventsLoading ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-md" />
                </div>
              ) : latestEvents.length > 0 ? (
                <div className="space-y-3">
                  {latestEvents.map((event: any) => (
                    <div key={`${event.transactionHash}-${event.logIndex}`} className="rounded-lg bg-base-200 p-3">
                      <div className="break-all font-mono text-xs">{event.args?.hash}</div>
                      <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                        <Address address={event.args?.storer} chain={targetNetwork} />
                        <span className="whitespace-nowrap text-base-content/60">
                          {formatTimestamp(event.args?.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg bg-base-200 p-4 text-sm text-base-content/60">Записей пока нет</div>
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default Home;
