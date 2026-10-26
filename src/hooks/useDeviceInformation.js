import { useEffect, useRef, useState } from "react";

/**
 * Own the existing full Info read at dashboard/session level. The Info tab and
 * Camera Header share this result even if Info is hidden before the read ends.
 * No second SSID query, retry loop, or BLE characteristic implementation is added.
 */
export default function useDeviceInformation(device, readInformation, failureMessage) {
  const requestRef = useRef(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!device) {
      requestRef.current = null;
      return;
    }
    let cancelled = false;
    let request = requestRef.current;
    if (!request || request.device !== device || request.reader !== readInformation) {
      // Cache the promise as well as the result: effect replay/tab switching must
      // not issue another full GATT read. A new connected device object gets a
      // new request; dashboard unmount (disconnect) releases this local cache.
      request = {
        device,
        reader: readInformation,
        active: true,
      };
      request.promise = Promise.resolve().then(() =>
        request.active ? readInformation(device) : null,
      );
      requestRef.current = request;
    }
    request.active = true;

    request.promise.then((info) => {
      if (!cancelled) setResult({ device, reader: readInformation, info, failed: !info });
    }, () => {
      if (!cancelled) setResult({ device, reader: readInformation, info: null, failed: true });
    });

    return () => {
      // The existing reader cannot cancel a multi-step native read. Ignore its
      // eventual result after a device change/disconnect; never publish it into
      // another session or schedule additional reads from this hook.
      cancelled = true;
      // Also prevent a deferred read from starting if disconnect happened before
      // its first microtask. Already-running native reads can only be ignored.
      request.active = false;
    };
  }, [device, readInformation]);

  // Hide the old device's data synchronously, before the next effect runs.
  const current = result?.device === device && result?.reader === readInformation
    ? result : null;
  return {
    info: current?.info || null,
    error: !device ? "No BLE device" : current?.failed ? failureMessage : null,
  };
}
