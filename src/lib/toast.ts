export interface ToastResult {
  status: "success" | "failure" | "soft-fail";
  title: string;
  message: string;
}

export const GenericSuccess: ToastResult = {
  status: "success",
  title: "",
  message: "",
};
