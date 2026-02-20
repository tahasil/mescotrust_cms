"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input, List } from "antd";

export default function SearchClient() {
  const searchParams = useSearchParams();
  const q0 = searchParams.get("q") || "";
  const [q, setQ] = useState(q0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async (query) => {
    const term = (query ?? q)?.trim();
    if (!term || term.length < 2) {
      setItems([]);
      setSearched(true);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/public/search?q=${encodeURIComponent(term)}`);
      const data = await res.json().catch(() => ({}));
      setItems(res.ok && data.items ? data.items : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Input.Search
        placeholder="Search pages and posts..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onSearch={doSearch}
        enterButton="Search"
        size="large"
        style={{ marginBottom: 24 }}
      />
      {searched && (
        items.length === 0 ? (
          <p style={{ color: "#666" }}>No results. Try a different query (min 2 characters).</p>
        ) : (
          <List
            loading={loading}
            dataSource={items}
            renderItem={(item) => (
              <List.Item>
                <Link href={item.url} style={{ fontSize: 16 }}>
                  {item.title}
                </Link>
                <span style={{ color: "#999", marginLeft: 8 }}>({item.type})</span>
              </List.Item>
            )}
          />
        )
      )}
    </>
  );
}
