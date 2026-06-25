import {
  useScaffoldEventHistory,
  useScaffoldReadContract,
  useScaffoldWriteContract,
  useTargetNetwork,
} from "~~/hooks/scaffold-eth";

export const useHashStorageRead = useScaffoldReadContract;
export const useHashStorageWrite = useScaffoldWriteContract;
export const useHashStorageEvents = useScaffoldEventHistory;
export const useHashStorageNetwork = useTargetNetwork;
