#!/bin/bash
echo "🔧 Setting up local PostgreSQL database..."

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "⚠️  PostgreSQL is not running"
    echo "📋 Starting PostgreSQL..."
    brew services start postgresql@15 2>/dev/null || brew services start postgresql 2>/dev/null || {
        echo "❌ Could not start PostgreSQL automatically"
        echo "💡 Please start PostgreSQL manually:"
        echo "   brew services start postgresql@15"
        exit 1
    }
    sleep 2
fi

# Create database if it doesn't exist
echo "📋 Creating database if needed..."
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'liaizen_dev'" | grep -q 1 || \
psql -U postgres -c "CREATE DATABASE liaizen_dev;" 2>/dev/null || {
    echo "⚠️  Could not create database (might already exist or need different user)"
}

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'ENVEOF'
DATABASE_URL=postgresql://postgres@localhost:5432/liaizen_dev
NODE_ENV=development
PORT=3001
JWT_SECRET=dev-secret-key-change-in-production
ENVEOF
    echo "✅ Created .env file"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🔍 Testing connection..."
node test-postgres-connection.js
