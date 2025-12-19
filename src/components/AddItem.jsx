import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { supabase } from "../supabaseClient"
import { useAuth } from "../context/AuthContext"

export default function AddItem() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  useEffect(() => {
    if (!user) {
      navigate("/auth")
      return
    }

    const url = params.get("url")
    const title = params.get("title")

    if (!url) {
      navigate("/")
      return
    }

    const saveItem = async () => {
      await supabase.from("items").insert([
        {
          user_id: user.id,
          title: title || "Untitled",
          content: url,
          category: "read",
          status: "pending"
        }
      ])

      navigate("/")
    }

    saveItem()
  }, [user])

  return (
    <div style={{ padding: "4rem", textAlign: "center" }}>
      Saving to Latero…
    </div>
  )
}
