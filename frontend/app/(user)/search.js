"use client";
import { useRouter,useSearchParams } from "next/navigation";
export default function Search() {
  const searchParams=useSearchParams();
  const key=searchParams.get("key");
  const router=useRouter();
  return (
    <>
      <div className="search">
        <input
          defaultValue={key}
          placeholder="Tìm sản phẩm, danh mục"
          onKeyUp={(event) => {
            if(event.key=="Enter"&&event.target.value!=""){
              router.push(`/search?key=${event.target.value}`)
            }
          }}
        ></input>
      </div>
    </>
  )
}