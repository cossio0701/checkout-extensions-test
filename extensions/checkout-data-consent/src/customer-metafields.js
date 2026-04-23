import { useEffect, useMemo, useRef } from "preact/hooks";
import {
  useCustomer,
  useAppMetafields,
} from "@shopify/ui-extensions/checkout/preact";

export function normalizeCustomerId(customer) {
  return customer?.id?.replace("gid://shopify/Customer/", "") ?? "";
}

/**
 * Returns the value of a customer metafield for the logged-in customer.
 * Memoized so the returned primitive stays reference-stable and does not
 * retrigger effects each render.
 *
 * @param {string} namespace
 * @param {string} key
 * @returns {string | undefined}
 */
export function useCustomerMetafield(namespace, key) {
  const customer = useCustomer();
  const id = normalizeCustomerId(customer);
  const all = useAppMetafields({ namespace });
  return useMemo(() => {
    if (!id) return undefined;
    return all.find(
      (e) =>
        e.target.type === "customer" &&
        e.target.id === id &&
        e.metafield.key === key,
    )?.metafield.value;
  }, [all, id, key]);
}

/**
 * Fires `callback` when the customer GID transitions to a different value
 * (logout, customer switch). Does NOT fire on initial mount nor on the
 * first login (undefined → id) — only on identity change away from a
 * previously known customer.
 *
 * Use this to wipe checkout attributes that contain PII from the previous
 * customer's metafield prefill.
 *
 * @param {(currentId: string | undefined, previousId: string) => void} callback
 */
export function useOnCustomerChange(callback) {
  const customer = useCustomer();
  const currentId = customer?.id;
  /** @type {{ current: string | undefined }} */
  const prevIdRef = useRef(undefined);
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    const prev = prevIdRef.current;
    if (prev !== undefined && prev !== currentId) {
      cbRef.current(currentId, prev);
    }
    prevIdRef.current = currentId;
  }, [currentId]);
}
