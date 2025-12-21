import { supabase } from '../supabaseClient'

/**
 * Validates and saves an item to Supabase.
 * This helper is shared between the Dashboard and the 'AddItem' (Extension) logic.
 */
export const saveItemHelper = async (user, payload) => {
    if (!user || !user.id) {
        throw new Error('User authentication required')
    }

    // Guard: Ensure only allowed fields are sent to match the schema
    const allowedFields = [
        'user_id',
        'content',
        'title',
        'reminder_at'
    ]

    const filteredPayload = Object.keys(payload)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
            obj[key] = payload[key]
            return obj
        }, {})

    // Ensure user_id matches the authenticated user
    filteredPayload.user_id = user.id

    // Default status if missing
    if (!filteredPayload.status) {
        filteredPayload.status = 'pending'
    }

    const { data, error } = await supabase
        .from('items')
        .insert(filteredPayload)
        .select()

    if (error) {
        console.error('Supabase save error:', error)
        throw error
    }

    return data[0]
}
