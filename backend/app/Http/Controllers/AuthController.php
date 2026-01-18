<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Events\UserLoggedIn;
use Illuminate\Http\Request;
use App\Services\AuditTrailService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log; 
class AuthController extends Controller
{
    protected $auditTrail;

    public function __construct(AuditTrailService $auditTrail)
    {
        $this->auditTrail = $auditTrail;
    }

    public function login(Request $request)
    {
        $request->validate([
            'identifier' => 'required|string', 
            'password' => 'required',
        ]);

        try {
            $identifier = $request->identifier;
            $loginField = filter_var($identifier, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
            $user = null;
    
            if ($loginField === 'email') {
                $regex = '/^[A-Za-z0-9._%+-]+@mis-mdo\.sch\.id$/';
    
                if (!preg_match($regex, $identifier)) {
                    $this->auditTrail->log('login_failed', [
                        'identifier' => $identifier,
                        'reason' => 'Email domain check failed'
                    ]);
    
                    return response()->json([
                        'success' => false,
                        'message' => 'Email/Username or Password is incorrect' 
                    ], 401);
                }
    
                $user = User::where('email', $identifier)->first();
            } else {
                $user = User::where('username', $identifier)->first();
            }
    
            if (!$user || !Hash::check($request->password, $user->password)) {
                $this->auditTrail->log('login_failed', [
                    'Email/Username' => $identifier,
                ]);
    
                return response()->json([
                    'success' => false,
                    'message' => 'Email/Username or Password is incorrect'
                ], 401);
            }

            Auth::login($user);

            $user->tokens()->delete();

            $newToken = $user->createToken('auth_token');

            $newToken->accessToken->forceFill([
                'last_used_at' => now(),
            ])->save();

            $token = $newToken->plainTextToken;

            $this->auditTrail->log('login_success', [
                'user_id' => $user->user_id,
                'email'   => $user->email,
                'username'   => $user->username,
                'full_name'   => $user->full_name,
                'role'    => $user->role,
            ]);

            event(new UserLoggedIn($user));

            return response()->json([
                'success' => true,
                'token'   => $token,
                'user'    => [
                    'user_id' => $user->user_id,
                    'username'    => $user->username,
                    'full_name'    => $user->full_name,
                    'email'   => $user->email,
                    'role'    => $user->role
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Auth Login Error: ' . $e->getMessage(), [
                'identifier' => $request->identifier ?? 'unknown',
                'file'       => $e->getFile(),
                'line'       => $e->getLine(),
                'trace'      => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred during the login process.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function logout(Request $request) 
    {
        try {
            $user = $request->user();
            $token = $request->user()->currentAccessToken();
            $tokenId = $token->id ?? null;
    
            if ($token) {
                $token->delete();
            }
    
            $this->auditTrail->log('logout_success', [
                'user_id'  => $user->user_id,
                'email'    => $user->email,
                'token_id' => $tokenId,
            ]);
    
            return response()->json([
                'success' => true,
                'message' => 'Successfully logged out.'
            ]);

        } catch (\Exception $e) {
            Log::error('Auth Logout Error: ' . $e->getMessage(), [
                'user_id' => $request->user()->user_id ?? 'unknown',
                'file'    => $e->getFile(),
                'line'    => $e->getLine(),
                'trace'   => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred during logout.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function me(Request $request) 
    {
        try {
            return response()->json($request->user());
        } catch (\Exception $e) {
            Log::error('Auth Me Error: ' . $e->getMessage(), [
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve user profile.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function resetLogin(Request $request)
    {
        $request->validate([
            'identifier' => 'required|string',
            'password' => 'required',
        ]);

        try {
            $identifier = $request->identifier;
            $loginField = filter_var($identifier, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
            $user = null;
    
            if ($loginField === 'email') {
                $regex = '/^[A-Za-z0-9._%+-]+@mis-mdo\.sch\.id$/';
    
                if (!preg_match($regex, $identifier)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Email or Username is incorrect'
                    ], 401);
                }
    
                $user = User::where('email', $identifier)->first();
            } else {
                $user = User::where('username', $identifier)->first();
            }
    
            if (!$user || !Hash::check($request->password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email/Username or Password is incorrect'
                ], 401);
            }
    
            $user->tokens()->delete();
    
            $this->auditTrail->log('reset_login', [
                'user_id' => $user->user_id,
                'email'   => $user->email,
                'username' => $user->username,
            ]);
    
            return response()->json([
                'success' => true,
                'message' => 'Login reset successful. Please login again.'
            ]);

        } catch (\Exception $e) {
            Log::error('Auth Reset Login Error: ' . $e->getMessage(), [
                'identifier' => $request->identifier ?? 'unknown',
                'file'       => $e->getFile(),
                'line'       => $e->getLine(),
                'trace'      => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while resetting login session.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
