import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { DatabaseService } from '@/lib/db/database-service';
import { isDatabaseEnabled } from '@/lib/db/connection';
import { getInitialUserRole } from '@/lib/auth/roles';

// Clerk webhook event types
interface ClerkUserCreatedEvent {
  type: 'user.created';
  data: {
    id: string;
    email_addresses: Array<{
      email_address: string;
      id: string;
    }>;
    first_name?: string;
    last_name?: string;
    username?: string;
  };
}

interface ClerkUserUpdatedEvent {
  type: 'user.updated';
  data: {
    id: string;
    email_addresses: Array<{
      email_address: string;
      id: string;
    }>;
    first_name?: string;
    last_name?: string;
    username?: string;
  };
}

interface ClerkUserDeletedEvent {
  type: 'user.deleted';
  data: {
    id: string;
    deleted: boolean;
  };
}

type ClerkWebhookEvent = ClerkUserCreatedEvent | ClerkUserUpdatedEvent | ClerkUserDeletedEvent;

export async function POST(req: NextRequest) {
  try {
    // Check if database is enabled
    if (!isDatabaseEnabled()) {
      console.log('⚠️ Database not enabled, skipping webhook processing');
      return NextResponse.json({ received: true, message: 'Database not enabled' });
    }

    // Get the webhook secret
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('❌ Missing CLERK_WEBHOOK_SECRET environment variable');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Get the headers
    const svix_id = req.headers.get('svix-id');
    const svix_timestamp = req.headers.get('svix-timestamp');
    const svix_signature = req.headers.get('svix-signature');

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('❌ Missing required Svix headers');
      return NextResponse.json(
        { error: 'Missing required headers' },
        { status: 400 }
      );
    }

    // Get the body
    const body = await req.text();

    // Create a new Svix instance with your secret
    const wh = new Webhook(webhookSecret);

    let evt: ClerkWebhookEvent;

    // Verify the payload with the headers
    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as ClerkWebhookEvent;
    } catch (err) {
      console.error('❌ Webhook verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook verification failed' },
        { status: 400 }
      );
    }

    // Initialize database service
    const dbService = new DatabaseService();

    // Handle the webhook
    switch (evt.type) {
      case 'user.created': {
        console.log('👤 Processing user.created webhook for:', evt.data.id);
        
        const primaryEmail = evt.data.email_addresses[0]?.email_address;
        if (!primaryEmail) {
          console.error('❌ No primary email found for user:', evt.data.id);
          return NextResponse.json(
            { error: 'No primary email found' },
            { status: 400 }
          );
        }

        // Create display name
        const displayName = evt.data.first_name && evt.data.last_name
          ? `${evt.data.first_name} ${evt.data.last_name}`
          : evt.data.username || evt.data.first_name || 'User';

        // Determine user role
        const userRole = getInitialUserRole(primaryEmail);

        try {
          const user = await dbService.createOrUpdateUser(
            evt.data.id,
            primaryEmail,
            displayName,
            userRole
          );

          console.log(`✅ User created in database: ${user.email} (ID: ${user.id})`);
          
          return NextResponse.json({
            success: true,
            message: 'User created successfully',
            userId: user.id
          });
        } catch (error) {
          console.error('❌ Failed to create user in database:', error);
          return NextResponse.json(
            { error: 'Failed to create user in database' },
            { status: 500 }
          );
        }
      }

      case 'user.updated': {
        console.log('👤 Processing user.updated webhook for:', evt.data.id);
        
        const primaryEmail = evt.data.email_addresses[0]?.email_address;
        if (!primaryEmail) {
          console.error('❌ No primary email found for user:', evt.data.id);
          return NextResponse.json(
            { error: 'No primary email found' },
            { status: 400 }
          );
        }

        // Create display name
        const displayName = evt.data.first_name && evt.data.last_name
          ? `${evt.data.first_name} ${evt.data.last_name}`
          : evt.data.username || evt.data.first_name || 'User';

        // For updates, preserve existing role (don't reassign)
        const existingUser = await dbService.getUserByClerkId(evt.data.id);
        const userRole = existingUser?.role || getInitialUserRole(primaryEmail);

        try {
          const user = await dbService.createOrUpdateUser(
            evt.data.id,
            primaryEmail,
            displayName,
            userRole
          );

          console.log(`✅ User updated in database: ${user.email} (ID: ${user.id})`);
          
          return NextResponse.json({
            success: true,
            message: 'User updated successfully',
            userId: user.id
          });
        } catch (error) {
          console.error('❌ Failed to update user in database:', error);
          return NextResponse.json(
            { error: 'Failed to update user in database' },
            { status: 500 }
          );
        }
      }

      case 'user.deleted': {
        console.log('👤 Processing user.deleted webhook for:', evt.data.id);
        
        try {
          // Get the user before deletion for logging
          const user = await dbService.getUserByClerkId(evt.data.id);
          
          if (user) {
            // Note: We might want to soft-delete or anonymize user data instead of hard deletion
            // For now, we'll just log that the user was deleted in Clerk
            console.log(`👤 User ${user.email} was deleted in Clerk (ID: ${evt.data.id})`);
            console.log('ℹ️ Database user record kept for data integrity');
          }
          
          return NextResponse.json({
            success: true,
            message: 'User deletion processed',
            note: 'Database record preserved for data integrity'
          });
        } catch (error) {
          console.error('❌ Failed to process user deletion:', error);
          return NextResponse.json(
            { error: 'Failed to process user deletion' },
            { status: 500 }
          );
        }
      }

      default:
        console.log(`🤷 Unhandled webhook event type: ${(evt as any).type}`);
        return NextResponse.json({
          success: true,
          message: 'Event type not handled'
        });
    }
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests (Clerk sends GET requests to verify endpoint)
export async function GET() {
  return NextResponse.json({
    message: 'Clerk webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}