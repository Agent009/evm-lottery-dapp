import { formatEther } from "viem";

export const renderLabelAndValue = <T extends bigint | boolean>(label: string, label2: string, value: T) => {
  return (
    <label className="form-control w-1/3 p-2">
      <div className="label">
        <span className="label-text">{label}</span>
        <span className="label-text-alt">{label2}</span>
      </div>
      <code className="flex-1 block whitespace-pre overflow-none text-left bg-base-200 p-2 rounded-md">
        {typeof value === "bigint" && formatEther(value)}
        {typeof value === "boolean" && (value ? "Yes" : "No")}
      </code>
    </label>
  );
};
