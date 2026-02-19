import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'

export default function RegistroPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      toast({ title: 'Las contraseñas no coinciden', variant: 'destructive' })
      return
    }
    if (password.length < 6) {
      toast({ title: 'La contraseña debe tener al menos 6 caracteres', variant: 'destructive' })
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      toast({ title: 'Error al registrarse', description: error.message, variant: 'destructive' })
    } else {
      setDone(true)
    }
    setLoading(false)
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-green-100 rounded-xl">
                <Wrench className="h-7 w-7 text-green-600" />
              </div>
            </div>
            <CardTitle>¡Cuenta creada!</CardTitle>
            <CardDescription>
              Revisa tu correo para confirmar la cuenta y luego inicia sesión.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/login">
              <Button className="w-full">Ir al login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-primary rounded-xl">
              <Wrench className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Crear cuenta</CardTitle>
          <CardDescription>Registro inicial del taller en Vercus</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegistro} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="taller@ejemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar contraseña</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creando cuenta…' : 'Crear cuenta'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-primary hover:underline">Iniciar sesión</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
