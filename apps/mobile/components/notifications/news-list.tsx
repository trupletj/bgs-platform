import { useState } from "react";
import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "@/components/ui/search-bar";
import { NewsCard } from "@/components/services/news-card";
import { S } from "@/constants/strings";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export function NewsList() {
  const [search, setSearch] = useState("");

  const { data: news } = useQuery({
    queryKey: queryKeys.news.all,
    queryFn: api.getNews,
  });

  const filtered = news?.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View>
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder={S.notifications.searchNews}
        className="mb-3"
      />
      {filtered?.map((item) => (
        <NewsCard key={item.id} item={item} />
      ))}
    </View>
  );
}
